import crypto from 'node:crypto';
import { Order, STATUS_LABELS } from '../models/Order.js';
import { Pizza } from '../models/Pizza.js';
import { InventoryItem } from '../models/InventoryItem.js';
import { User } from '../models/User.js';
import { HttpError } from '../utils/httpError.js';
import { roundMoney, SIZE_LABELS, SIZE_MULTIPLIERS, TAX_RATE, DELIVERY_FEE, FREE_DELIVERY_THRESHOLD, resolveCoupon } from '../utils/money.js';
import { reserveStock, restoreStock, checkLowStockAndNotify } from './inventoryService.js';
import { emitToAdmins, emitToUser } from './socket.js';
import { orderConfirmedEmail, sendMail } from './mailer.js';
import { env } from '../config/env.js';

const MAX_ITEMS = 12;
const MAX_QUANTITY = 10;
const PAYMENT_WINDOW_MS = 30 * 60 * 1000;

const FORWARD_STATUSES = ['received', 'in_kitchen', 'out_for_delivery', 'delivered'];

export function newOrderNumber() {
  const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const suffix = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `ST-${date}-${suffix}`;
}

function cleanText(value, max = 200) {
  return String(value || '').trim().slice(0, max);
}

function asOption(item) {
  return {
    id: item._id,
    slug: item.slug,
    name: item.name,
    price: item.price,
    category: item.category,
  };
}

function ensureSize(size) {
  if (!SIZE_MULTIPLIERS[size]) {
    throw new HttpError(422, 'Choose a valid pizza size.', undefined, 'INVALID_SIZE');
  }
  return size;
}

function ensureQuantity(quantity) {
  const value = Number(quantity || 1);
  if (!Number.isInteger(value) || value < 1 || value > MAX_QUANTITY) {
    throw new HttpError(422, `Quantity must be between 1 and ${MAX_QUANTITY}.`, undefined, 'INVALID_QUANTITY');
  }
  return value;
}

async function findPizza(payload) {
  const query = payload.pizzaId ? { _id: payload.pizzaId } : { slug: payload.pizzaSlug };
  const pizza = await Pizza.findOne(query).populate('recipe.inventoryItem');
  if (!pizza || !pizza.isAvailable) {
    throw new HttpError(404, 'That pizza is not available right now.', undefined, 'PIZZA_UNAVAILABLE');
  }
  return pizza;
}

async function buildPresetItem(payload) {
  const pizza = await findPizza(payload);
  const size = ensureSize(payload.size || 'medium');
  const quantity = ensureQuantity(payload.quantity);
  const multiplier = SIZE_MULTIPLIERS[size];
  const unitPrice = roundMoney(pizza.basePrice * multiplier);
  const recipe = [];

  for (const line of pizza.recipe) {
    const item = line.inventoryItem;
    if (!item || !item.isAvailable) {
      throw new HttpError(409, `An ingredient for ${pizza.name} is unavailable right now.`, undefined, 'INGREDIENT_UNAVAILABLE');
    }
    recipe.push({
      inventoryItem: item._id,
      name: item.name,
      category: item.category,
      quantity: line.quantity * quantity,
    });
  }

  return {
    kind: 'preset',
    pizza: pizza._id,
    name: pizza.name,
    description: pizza.description,
    image: pizza.image,
    size,
    sizeLabel: SIZE_LABELS[size],
    quantity,
    unitPrice,
    lineTotal: roundMoney(unitPrice * quantity),
    recipe,
  };
}

async function buildCustomItem(payload) {
  const size = ensureSize(payload.size || 'medium');
  const quantity = ensureQuantity(payload.quantity);
  const multiplier = SIZE_MULTIPLIERS[size];

  if (!payload.baseId || !payload.sauceId || !payload.cheeseId) {
    throw new HttpError(422, 'Pick a base, sauce and cheese to build your pizza.', undefined, 'INCOMPLETE_PIZZA');
  }

  const vegetableIds = Array.isArray(payload.vegetableIds) ? [...new Set(payload.vegetableIds)] : [];
  if (vegetableIds.length > 8) {
    throw new HttpError(422, 'You can add up to 8 vegetables.', undefined, 'TOO_MANY_VEGETABLES');
  }

  const ids = [payload.baseId, payload.sauceId, payload.cheeseId, ...vegetableIds];
  const items = await InventoryItem.find({ _id: { $in: ids } });
  const byId = new Map(items.map((item) => [String(item._id), item]));

  const base = byId.get(String(payload.baseId));
  const sauce = byId.get(String(payload.sauceId));
  const cheese = byId.get(String(payload.cheeseId));
  const vegetables = vegetableIds.map((id) => byId.get(String(id))).filter(Boolean);

  if (!base || base.category !== 'base') throw new HttpError(422, 'Choose a valid base.', undefined, 'INVALID_BASE');
  if (!sauce || sauce.category !== 'sauce') throw new HttpError(422, 'Choose a valid sauce.', undefined, 'INVALID_SAUCE');
  if (!cheese || cheese.category !== 'cheese') throw new HttpError(422, 'Choose a valid cheese.', undefined, 'INVALID_CHEESE');
  if (vegetables.length !== vegetableIds.length || vegetables.some((item) => item.category !== 'vegetable')) {
    throw new HttpError(422, 'One of those vegetables is invalid.', undefined, 'INVALID_VEGETABLE');
  }
  if ([base, sauce, cheese, ...vegetables].some((item) => !item.isAvailable)) {
    throw new HttpError(409, 'One of those ingredients is unavailable right now.', undefined, 'INGREDIENT_UNAVAILABLE');
  }

  const toppingTotal = [base, sauce, cheese, ...vegetables].reduce((sum, item) => sum + item.price, 0);
  const unitPrice = roundMoney(toppingTotal * multiplier);
  const all = [base, sauce, cheese, ...vegetables];
  const recipe = all.map((item) => ({
    inventoryItem: item._id,
    name: item.name,
    category: item.category,
    quantity: quantity,
  }));

  const descriptionParts = [
    base.name,
    sauce.name,
    cheese.name,
    vegetables.length ? vegetables.map((veg) => veg.name).join(', ') : 'No extra vegetables',
  ];

  return {
    kind: 'custom',
    name: 'Build Your Own',
    description: descriptionParts.join(' · '),
    image: '/media/pizzas/margherita.webp',
    size,
    sizeLabel: SIZE_LABELS[size],
    quantity,
    unitPrice,
    lineTotal: roundMoney(unitPrice * quantity),
    custom: {
      base: asOption(base),
      sauce: asOption(sauce),
      cheese: asOption(cheese),
      vegetables: vegetables.map(asOption),
    },
    recipe,
  };
}

export async function buildOrderItems(rawItems) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw new HttpError(422, 'Your cart is empty.', undefined, 'EMPTY_CART');
  }
  if (rawItems.length > MAX_ITEMS) {
    throw new HttpError(422, `You can order at most ${MAX_ITEMS} different items at a time.`, undefined, 'CART_TOO_BIG');
  }

  const items = [];
  for (const raw of rawItems) {
    if (!raw || !['preset', 'custom'].includes(raw.kind)) {
      throw new HttpError(422, 'Invalid cart item.', undefined, 'INVALID_ITEM');
    }
    items.push(raw.kind === 'preset' ? await buildPresetItem(raw) : await buildCustomItem(raw));
  }
  return items;
}

export function priceOrder(items, couponCode = '') {
  const subtotal = roundMoney(items.reduce((sum, item) => sum + item.lineTotal, 0));
  const coupon = resolveCoupon(couponCode);
  if (String(couponCode || '').trim() && !coupon) {
    throw new HttpError(422, 'That coupon code is not valid. Try INFOBYTE for 40% off.', undefined, 'INVALID_COUPON');
  }
  const discount = coupon ? roundMoney(subtotal * (coupon.percent / 100)) : 0;
  const taxable = Math.max(0, roundMoney(subtotal - discount));
  const tax = roundMoney(taxable * TAX_RATE);
  const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const total = roundMoney(taxable + tax + deliveryFee);
  return {
    subtotal,
    tax,
    deliveryFee,
    discount,
    couponCode: coupon?.code || '',
    total,
  };
}

export async function createDraftOrder({ user, items: rawItems, deliveryAddress, paymentMethod = 'online', couponCode = '' }) {
  const items = await buildOrderItems(rawItems);
  const pricing = priceOrder(items, couponCode);
  const isCod = paymentMethod === 'cod';
  const address = {
    line1: cleanText(deliveryAddress.line1, 160),
    line2: cleanText(deliveryAddress.line2, 160),
    city: cleanText(deliveryAddress.city, 80),
    state: cleanText(deliveryAddress.state, 80),
    pincode: cleanText(deliveryAddress.pincode, 12),
    phone: cleanText(deliveryAddress.phone, 20),
    instructions: cleanText(deliveryAddress.instructions, 300),
  };

  if (!address.line1 || !address.city || !address.state || !address.pincode || !address.phone) {
    throw new HttpError(422, 'A complete delivery address is required.', undefined, 'INVALID_ADDRESS');
  }
  if (!/^[0-9+\-\s()]{8,20}$/.test(address.phone)) {
    throw new HttpError(422, 'Enter a valid phone number.', undefined, 'INVALID_PHONE');
  }
  if (!/^[1-9][0-9]{5}$/.test(address.pincode)) {
    throw new HttpError(422, 'Enter a valid 6-digit pincode.', undefined, 'INVALID_PINCODE');
  }

  const order = await Order.create({
    orderNumber: newOrderNumber(),
    user: user._id,
    items,
    pricing,
    deliveryAddress: address,
    status: isCod ? 'received' : 'payment_pending',
    payment: {
      provider: isCod ? 'cod' : env.paymentsMode === 'razorpay' ? 'razorpay' : 'mock',
      status: 'pending',
      amount: pricing.total,
      currency: env.currency,
      note: isCod ? 'Cash on delivery — collect at the door.' : '',
    },
    paymentExpiresAt: isCod ? null : new Date(Date.now() + PAYMENT_WINDOW_MS),
  });

  if (isCod) {
    await confirmCodOrder(order);
  }

  return order;
}

async function confirmCodOrder(order) {
  const allRecipeLines = (order.items || []).flatMap((item) => item.recipe);

  if (allRecipeLines.length) {
    await reserveStock(allRecipeLines);
  }

  try {
    order.status = 'received';
    order.payment.provider = 'cod';
    order.payment.status = 'pending';
    order.payment.cod = true;
    order.estimatedDeliveryAt = new Date(Date.now() + 35 * 60 * 1000);
    order.timeline.push({
      status: 'received',
      label: STATUS_LABELS.received,
      note: 'Order confirmed · cash on delivery. Keep the change ready.',
    });
    await order.save();
  } catch (error) {
    if (allRecipeLines.length) {
      await restoreStock(allRecipeLines).catch((restoreError) =>
        console.error('[order] Failed to restore stock after COD save error:', restoreError.message)
      );
    }
    throw error;
  }

  const publicOrder = order.toPublic();
  emitToUser(order.user, 'order:updated', { order: publicOrder });
  emitToUser(order.user, 'order:created', { order: publicOrder });
  emitToAdmins('order:new', { order: publicOrder });

  sendConfirmation(order, { cod: true });
}

async function sendConfirmation(order, { cod = false } = {}) {
  try {
    const user = await User.findById(order.user).lean();
    if (!user) return;
    const email = orderConfirmedEmail({ order, name: user.name, cod });
    await sendMail({ to: user.email, subject: email.subject, html: email.html, text: email.text });
  } catch (error) {
    console.error('[order] Confirmation email failed:', error.message);
  }
}

export async function confirmOrderPayment({
  orderId,
  userId,
  provider,
  razorpayPaymentId = '',
  razorpayOrderId = '',
}) {
  const order = await Order.findOne({ _id: orderId, user: userId });
  if (!order) throw new HttpError(404, 'Order not found.', undefined, 'ORDER_NOT_FOUND');

  if (order.payment.status === 'paid') {
    return order;
  }
  if (order.status !== 'payment_pending' || order.payment.status !== 'pending') {
    throw new HttpError(409, 'This order is not awaiting payment.', undefined, 'ORDER_NOT_PAYABLE');
  }
  if (order.paymentExpiresAt && order.paymentExpiresAt.getTime() < Date.now()) {
    throw new HttpError(410, 'This checkout session expired. Please start a new order.', undefined, 'PAYMENT_EXPIRED');
  }

  const allRecipeLines = order.items.flatMap((item) => item.recipe);

  try {
    await reserveStock(allRecipeLines);
  } catch (error) {
    throw error;
  }

  try {
    order.status = 'received';
    order.payment.status = 'paid';
    order.payment.provider = provider;
    order.payment.paidAt = new Date();
    order.payment.razorpayPaymentId = razorpayPaymentId;
    if (razorpayOrderId) order.payment.razorpayOrderId = razorpayOrderId;
    order.estimatedDeliveryAt = new Date(Date.now() + 35 * 60 * 1000);
    order.timeline.push({
      status: 'received',
      label: STATUS_LABELS.received,
      note: 'Payment confirmed. The kitchen has your ticket.',
    });
    await order.save();
  } catch (error) {
    await restoreStock(allRecipeLines).catch((restoreError) =>
      console.error('[order] Failed to restore stock after save error:', restoreError.message)
    );
    throw error;
  }

  const publicOrder = order.toPublic();
  emitToUser(order.user, 'order:updated', { order: publicOrder });
  emitToUser(order.user, 'order:created', { order: publicOrder });
  emitToAdmins('order:new', { order: publicOrder });

  sendConfirmation(order);
  setTimeout(() => {
    checkLowStockAndNotify({ trigger: 'order-confirmation' }).catch((error) =>
      console.error('[inventory] Post-order low stock check failed:', error.message)
    );
  }, 1000);

  return order;
}

export function allowedStatuses(order) {
  if (order.status === 'payment_pending') return ['cancelled'];
  if (order.status === 'cancelled' || order.status === 'delivered') return [];
  const index = FORWARD_STATUSES.indexOf(order.status);
  const forward = index >= 0 ? FORWARD_STATUSES.slice(index + 1) : [];
  return [...forward, 'cancelled'];
}

export async function updateOrderStatus({ order, status, note }) {
  if (!status || (!STATUS_LABELS[status] && status !== 'cancelled')) {
    throw new HttpError(422, 'Choose a valid order status.', undefined, 'INVALID_STATUS');
  }
  if (order.status === status) {
    return order;
  }
  const allowed = allowedStatuses(order);
  if (!allowed.includes(status)) {
    throw new HttpError(
      409,
      `Order cannot move from ${STATUS_LABELS[order.status]} to ${STATUS_LABELS[status] || status}.`,
      { allowed },
      'INVALID_TRANSITION'
    );
  }

  const previous = order.status;
  order.status = status;
  order.timeline.push({
    status,
    label: status === 'cancelled' ? 'Order Cancelled' : STATUS_LABELS[status],
    note: cleanText(note, 240) || `Status updated from ${STATUS_LABELS[previous] || previous}.`,
  });

  if (status === 'cancelled') {
    order.cancelReason = cleanText(note, 240) || 'Cancelled by the Slice Theory team.';
    if (order.payment.status === 'paid' || order.payment.provider === 'cod') {
      const lines = order.items.flatMap((item) => item.recipe);
      await restoreStock(lines);
    }
  }

  if (status === 'delivered') {
    order.estimatedDeliveryAt = new Date();
    if (order.payment.provider === 'cod' && order.payment.status === 'pending') {
      order.payment.status = 'paid';
      order.payment.paidAt = new Date();
      order.timeline.push({
        status: 'delivered',
        label: 'Cash collected',
        note: 'Cash on delivery collected. The theory is complete.',
      });
    }
  }

  await order.save();

  const publicOrder = order.toPublic();
  emitToUser(order.user, 'order:updated', { order: publicOrder });
  emitToAdmins('order:updated', { order: publicOrder });
  return order;
}

export async function getAdminOrderPayload(order) {
  const user = order.user && order.user.name !== undefined ? order.user : await User.findById(order.user).select('name email phone');
  return {
    ...order.toPublic(),
    customer: user
      ? { id: String(user._id), name: user.name || 'Guest', email: user.email, phone: user.phone || '' }
      : null,
    paymentInternal: order.payment,
    allowedStatuses: allowedStatuses(order),
  };
}
