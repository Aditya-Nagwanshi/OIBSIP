import { InventoryItem } from '../models/InventoryItem.js';
import { StockAlert } from '../models/StockAlert.js';
import { env } from '../config/env.js';
import { emitToAdmins } from './socket.js';
import { lowStockEmail, sendMail } from './mailer.js';
import { HttpError } from '../utils/httpError.js';

function aggregateLines(lines) {
  const totals = new Map();
  for (const line of lines) {
    const id = String(line.inventoryItem?._id || line.inventoryItem);
    const quantity = Number(line.quantity || 0);
    if (!id || quantity <= 0) continue;
    const existing = totals.get(id);
    if (existing) existing.quantity += quantity;
    else totals.set(id, { id, quantity, name: line.name, category: line.category });
  }
  return [...totals.values()];
}

export async function reserveStock(lines) {
  const totals = aggregateLines(lines);
  const reserved = [];
  const missing = [];

  for (const total of totals) {
    const updated = await InventoryItem.findOneAndUpdate(
      { _id: total.id, isAvailable: true, stock: { $gte: total.quantity } },
      { $inc: { stock: -total.quantity } },
      { new: true }
    );

    if (!updated) {
      const current = await InventoryItem.findById(total.id).lean();
      missing.push({
        name: current?.name || total.name || 'Ingredient',
        category: current?.category || total.category,
        required: total.quantity,
        available: current?.stock ?? 0,
      });
      continue;
    }
    reserved.push({ id: total.id, quantity: total.quantity });
  }

  if (missing.length) {
    await Promise.all(
      reserved.map((entry) =>
        InventoryItem.updateOne({ _id: entry.id }, { $inc: { stock: entry.quantity } })
      )
    );
    throw new HttpError(
      409,
      'Some ingredients just ran out. Please adjust your pizza and try again.',
      { missing },
      'OUT_OF_STOCK'
    );
  }

  return InventoryItem.find({ _id: { $in: totals.map((entry) => entry.id) } }).select(
    'name category stock lowStockThreshold unit isAvailable'
  );
}

export async function restoreStock(lines) {
  const totals = aggregateLines(lines);
  await Promise.all(
    totals.map((entry) =>
      InventoryItem.updateOne({ _id: entry.id }, { $inc: { stock: entry.quantity } })
    )
  );
}

export async function getLowStockItems() {
  return InventoryItem.find({
    isAvailable: true,
    $expr: { $lte: ['$stock', '$lowStockThreshold'] },
  })
    .sort({ stock: 1, category: 1, name: 1 })
    .lean();
}

export async function checkLowStockAndNotify({ force = false, trigger = 'cron' } = {}) {
  const lowItems = await getLowStockItems();
  if (!lowItems.length) {
    return { lowItems: [], sent: false, reason: 'No low stock items' };
  }

  const cooldownMs = env.lowStockCooldownHours * 60 * 60 * 1000;
  const now = Date.now();
  const eligible = lowItems.filter((item) => {
    if (force) return true;
    if (!item.lastLowStockAlertAt) return true;
    return now - new Date(item.lastLowStockAlertAt).getTime() >= cooldownMs;
  });

  emitToAdmins('inventory:low', {
    items: lowItems.map((item) => ({
      id: String(item._id),
      name: item.name,
      category: item.category,
      stock: item.stock,
      threshold: item.lowStockThreshold,
      unit: item.unit,
    })),
    at: new Date().toISOString(),
  });

  if (!eligible.length) {
    return {
      lowItems,
      sent: false,
      reason: `All items are within the ${env.lowStockCooldownHours}h alert cooldown.`,
    };
  }

  const alertItems = eligible.map((item) => ({
    inventoryItem: item._id,
    name: item.name,
    category: item.category,
    stock: item.stock,
    threshold: item.lowStockThreshold,
    unit: item.unit,
  }));

  const email = lowStockEmail({ items: alertItems, figure: env.clientUrls[0] });
  let status = 'failed';
  let error = '';

  try {
    const result = await sendMail({
      to: env.adminEmail,
      subject: email.subject,
      html: email.html,
      text: email.text,
    });
    status = result.status;
  } catch (err) {
    error = err.message;
    console.error('[inventory] Low stock email failed:', err.message);
  }

  if (status !== 'failed') {
    await InventoryItem.updateMany(
      { _id: { $in: eligible.map((item) => item._id) } },
      { $set: { lastLowStockAlertAt: new Date() } }
    );
  }

  const alert = await StockAlert.create({
    items: alertItems,
    recipient: env.adminEmail,
    subject: email.subject,
    status,
    error,
    sentAt: new Date(),
  });

  console.log(`[inventory] Low stock check (${trigger}): ${eligible.length} item(s), email ${status}.`);

  return { lowItems, sent: status !== 'failed', alertId: String(alert._id), status, eligibleCount: eligible.length };
}
