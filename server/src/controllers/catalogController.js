import { Pizza } from '../models/Pizza.js';
import { InventoryItem } from '../models/InventoryItem.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { serializeInventoryItem, serializePizza } from '../utils/serializers.js';
import { env } from '../config/env.js';
import { paymentMode } from '../services/razorpayService.js';
import { SIZE_LABELS, SIZE_MULTIPLIERS, TAX_RATE, DELIVERY_FEE, FREE_DELIVERY_THRESHOLD } from '../utils/money.js';

function canOrderPizza(pizza) {
  if (!pizza.isAvailable || !pizza.recipe?.length) return false;
  return pizza.recipe.every(
    (line) => line.inventoryItem?.isAvailable && line.inventoryItem.stock >= line.quantity
  );
}

export const listPizzas = asyncHandler(async (_req, res) => {
  const pizzas = await Pizza.find({})
    .populate('recipe.inventoryItem')
    .sort({ featured: -1, createdAt: 1 })
    .lean({ virtuals: false });

  res.json({
    pizzas: pizzas.map((pizza) => ({
      ...serializePizza(pizza),
      canOrder: canOrderPizza(pizza),
    })),
  });
});

export const getPizza = asyncHandler(async (req, res) => {
  const pizza = await Pizza.findOne({ slug: req.params.slug }).populate('recipe.inventoryItem');
  if (!pizza) {
    res.status(404).json({ message: 'Pizza not found.', code: 'PIZZA_NOT_FOUND' });
    return;
  }
  res.json({ pizza: { ...serializePizza(pizza), canOrder: canOrderPizza(pizza) } });
});

export const builderOptions = asyncHandler(async (_req, res) => {
  const items = await InventoryItem.find({}).sort({ category: 1, sortOrder: 1, name: 1 });

  const groups = { base: [], sauce: [], cheese: [], vegetable: [] };
  for (const item of items) {
    if (groups[item.category]) groups[item.category].push(serializeInventoryItem(item));
  }

  res.json({
    groups,
    sizes: Object.entries(SIZE_MULTIPLIERS).map(([id, multiplier]) => ({
      id,
      multiplier,
      label: SIZE_LABELS[id],
    })),
  });
});

export const publicConfig = asyncHandler(async (_req, res) => {
  res.json({
    brand: 'Slice Theory',
    currency: env.currency,
    payments: {
      mode: paymentMode(),
      keyId: paymentMode() === 'razorpay' ? env.razorpayKeyId : null,
    },
    taxRate: TAX_RATE,
    deliveryFee: DELIVERY_FEE,
    freeDeliveryThreshold: FREE_DELIVERY_THRESHOLD,
    sizes: Object.entries(SIZE_MULTIPLIERS).map(([id, multiplier]) => ({
      id,
      multiplier,
      label: SIZE_LABELS[id],
    })),
    admin: {
      email: env.adminEmailDisplay,
      passwordless: true,
    },
  });
});
