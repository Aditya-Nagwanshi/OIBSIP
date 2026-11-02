import { z } from 'zod';
import { Order, ORDER_STATUSES } from '../models/Order.js';
import { InventoryItem } from '../models/InventoryItem.js';
import { User } from '../models/User.js';
import { StockAlert } from '../models/StockAlert.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { parseBody } from '../middleware/validate.js';
import { HttpError } from '../utils/httpError.js';
import { serializeInventoryItem } from '../utils/serializers.js';
import { getLowStockItems, checkLowStockAndNotify } from '../services/inventoryService.js';
import { getAdminOrderPayload, updateOrderStatus, allowedStatuses } from '../services/orderService.js';
import { emitToAdmins } from '../services/socket.js';
import { roundMoney } from '../utils/money.js';

const inventoryCategories = ['base', 'sauce', 'cheese', 'vegetable'];

function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80);
}

export const getStats = asyncHandler(async (_req, res) => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const weekStart = new Date(startOfToday);
  weekStart.setDate(weekStart.getDate() - 6);

  const [orders, usersCount, inventory, recent] = await Promise.all([
    Order.find({}).select('orderNumber items pricing status payment createdAt').lean(),
    User.countDocuments({ role: 'user' }),
    InventoryItem.find({}).lean(),
    Order.find({}).sort({ createdAt: -1 }).limit(6).populate('user', 'name email').lean(),
  ]);

  const paidOrders = orders.filter(
    (order) => order.payment.status === 'paid' && order.status !== 'cancelled'
  );
  const revenue = roundMoney(paidOrders.reduce((sum, order) => sum + order.pricing.total, 0));
  const ordersToday = orders.filter((order) => new Date(order.createdAt) >= startOfToday).length;
  const activeOrders = orders.filter((order) =>
    ['received', 'in_kitchen', 'out_for_delivery'].includes(order.status)
  ).length;
  const deliveredOrders = orders.filter((order) => order.status === 'delivered').length;

  const weekly = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const day = new Date(startOfToday);
    day.setDate(day.getDate() - offset);
    const next = new Date(day);
    next.setDate(next.getDate() + 1);
    const dayPaid = paidOrders.filter((order) => {
      const time = new Date(order.createdAt);
      return time >= day && time < next;
    });
    weekly.push({
      date: day.toISOString().slice(0, 10),
      label: day.toLocaleDateString('en-IN', { weekday: 'short' }),
      revenue: roundMoney(dayPaid.reduce((sum, order) => sum + order.pricing.total, 0)),
      orders: dayPaid.length,
    });
  }

  const itemMap = new Map();
  for (const order of paidOrders) {
    for (const item of order.items) {
      const key = item.name;
      const current = itemMap.get(key) || { name: key, quantity: 0, revenue: 0 };
      current.quantity += item.quantity;
      current.revenue = roundMoney(current.revenue + item.lineTotal);
      itemMap.set(key, current);
    }
  }
  const topPizzas = [...itemMap.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 5);

  const lowStock = inventory.filter(
    (item) => item.isAvailable && item.stock <= item.lowStockThreshold
  );
  const inventoryHealth = inventory.length
    ? Math.round(((inventory.length - lowStock.length) / inventory.length) * 100)
    : 100;

  const statusCounts = Object.fromEntries(ORDER_STATUSES.map((status) => [status, 0]));
  for (const order of orders) statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;

  res.json({
    stats: {
      revenue,
      ordersToday,
      activeOrders,
      deliveredOrders,
      totalOrders: orders.length,
      totalCustomers: usersCount,
      lowStockCount: lowStock.length,
      inventoryHealth,
      averageOrderValue: paidOrders.length ? roundMoney(revenue / paidOrders.length) : 0,
    },
    weekly,
    topPizzas,
    statusCounts,
    lowStock: lowStock.map(serializeInventoryItem),
    recentOrders: recent.map((order) => ({
      id: String(order._id),
      orderNumber: order.orderNumber,
      status: order.status,
      total: order.pricing.total,
      customer: order.user ? { name: order.user.name, email: order.user.email } : null,
      createdAt: order.createdAt,
    })),
  });
});

export const listInventory = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.category && inventoryCategories.includes(req.query.category)) {
    filter.category = req.query.category;
  }
  const items = await InventoryItem.find(filter).sort({ category: 1, sortOrder: 1, name: 1 });
  const lowStock = await getLowStockItems();
  res.json({
    items: items.map(serializeInventoryItem),
    lowStockCount: lowStock.length,
    categories: inventoryCategories,
  });
});

const updateInventorySchema = z.object({
  stock: z.number().int().min(0).max(100000).optional(),
  adjustBy: z.number().int().min(-10000).max(10000).optional(),
  lowStockThreshold: z.number().int().min(0).max(10000).optional(),
  price: z.number().min(0).max(100000).optional(),
  isAvailable: z.boolean().optional(),
  name: z.string().trim().min(2).max(80).optional(),
  description: z.string().trim().max(280).optional(),
  unit: z.string().trim().max(20).optional(),
  emoji: z.string().trim().max(8).optional(),
});

export const updateInventoryItem = asyncHandler(async (req, res) => {
  const data = parseBody(updateInventorySchema, req.body);
  if (data.stock !== undefined && data.adjustBy !== undefined) {
    throw new HttpError(422, 'Send either stock or adjustBy, not both.', undefined, 'CONFLICTING_STOCK_UPDATE');
  }

  const item = await InventoryItem.findById(req.params.id);
  if (!item) throw new HttpError(404, 'Inventory item not found.', undefined, 'ITEM_NOT_FOUND');

  if (data.stock !== undefined) item.stock = data.stock;
  if (data.adjustBy !== undefined) item.stock = Math.max(0, item.stock + data.adjustBy);
  if (data.lowStockThreshold !== undefined) item.lowStockThreshold = data.lowStockThreshold;
  if (data.price !== undefined) item.price = data.price;
  if (data.isAvailable !== undefined) item.isAvailable = data.isAvailable;
  if (data.name !== undefined) item.name = data.name;
  if (data.description !== undefined) item.description = data.description;
  if (data.unit !== undefined) item.unit = data.unit;
  if (data.emoji !== undefined) item.emoji = data.emoji;

  await item.save();

  const payload = serializeInventoryItem(item);
  emitToAdmins('inventory:updated', { item: payload });

  if (item.stock <= item.lowStockThreshold) {
    setTimeout(() => {
      checkLowStockAndNotify({ trigger: 'manual-update' }).catch((error) =>
        console.error('[inventory] Manual low-stock check failed:', error.message)
      );
    }, 250);
  }

  res.json({ message: 'Inventory updated.', item: payload });
});

const createInventorySchema = z.object({
  category: z.enum(inventoryCategories),
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().max(80).optional(),
  description: z.string().trim().max(280).optional().default(''),
  price: z.number().min(0).max(100000),
  stock: z.number().int().min(0).max(100000),
  unit: z.string().trim().max(20).optional().default('unit'),
  lowStockThreshold: z.number().int().min(0).max(10000).optional().default(20),
  emoji: z.string().trim().max(8).optional().default('🍕'),
  color: z.string().trim().max(20).optional().default('#FFC93C'),
  isAvailable: z.boolean().optional().default(true),
});

export const createInventoryItem = asyncHandler(async (req, res) => {
  const data = parseBody(createInventorySchema, req.body);
  const slug = slugify(data.slug || data.name);
  if (!slug) throw new HttpError(422, 'A valid item name or slug is required.', undefined, 'INVALID_SLUG');
  const exists = await InventoryItem.findOne({ slug });
  if (exists) throw new HttpError(409, 'An inventory item with that slug already exists.', undefined, 'DUPLICATE_SLUG');

  const item = await InventoryItem.create({ ...data, slug });
  res.status(201).json({ message: 'Inventory item created.', item: serializeInventoryItem(item) });
});

export const listOrders = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
  const filter = {};

  if (req.query.status && req.query.status !== 'all') {
    if (req.query.status === 'active') {
      filter.status = { $in: ['received', 'in_kitchen', 'out_for_delivery'] };
    } else if (ORDER_STATUSES.includes(req.query.status)) {
      filter.status = req.query.status;
    }
  }

  if (req.query.search) {
    const search = String(req.query.search).trim().slice(0, 80);
    const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const users = await User.find({ $or: [{ name: regex }, { email: regex }] })
      .select('_id')
      .limit(50)
      .lean();
    filter.$or = [{ orderNumber: regex }];
    if (users.length) filter.$or.push({ user: { $in: users.map((user) => user._id) } });
  }

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('user', 'name email phone'),
    Order.countDocuments(filter),
  ]);

  res.json({
    orders: await Promise.all(orders.map(getAdminOrderPayload)),
    pagination: {
      page,
      limit,
      total,
      pages: Math.max(1, Math.ceil(total / limit)),
    },
  });
});

export const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email phone');
  if (!order) throw new HttpError(404, 'Order not found.', undefined, 'ORDER_NOT_FOUND');
  res.json({ order: await getAdminOrderPayload(order) });
});

const statusSchema = z.object({
  status: z.string().trim().min(3).max(30),
  note: z.string().trim().max(240).optional().default(''),
});

export const changeOrderStatus = asyncHandler(async (req, res) => {
  const data = parseBody(statusSchema, req.body);
  const order = await Order.findById(req.params.id).populate('user', 'name email phone');
  if (!order) throw new HttpError(404, 'Order not found.', undefined, 'ORDER_NOT_FOUND');

  const updated = await updateOrderStatus({ order, status: data.status, note: data.note });
  const fresh = await Order.findById(updated._id).populate('user', 'name email phone');

  res.json({
    message: `Order moved to ${fresh.status === 'cancelled' ? 'Cancelled' : fresh.status.replace(/_/g, ' ')}.`,
    order: await getAdminOrderPayload(fresh),
  });
});

export const listStockAlerts = asyncHandler(async (_req, res) => {
  const alerts = await StockAlert.find({}).sort({ createdAt: -1 }).limit(30).lean();
  res.json({
    alerts: alerts.map((alert) => ({
      id: String(alert._id),
      items: alert.items,
      status: alert.status,
      recipient: alert.recipient,
      subject: alert.subject,
      error: alert.error,
      sentAt: alert.sentAt,
    })),
  });
});

export const triggerLowStockCheck = asyncHandler(async (req, res) => {
  const force = req.body?.force !== false;
  const result = await checkLowStockAndNotify({ force, trigger: 'manual' });
  res.json({
    message: result.sent
      ? `Low stock alert sent for ${result.eligibleCount} item(s).`
      : result.reason || 'No alert was needed.',
    ...result,
    lowItems: result.lowItems?.map((item) =>
      item._id ? serializeInventoryItem(item) : item
    ),
  });
});
