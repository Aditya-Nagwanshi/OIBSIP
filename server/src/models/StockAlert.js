import mongoose from 'mongoose';

const alertItemSchema = new mongoose.Schema(
  {
    inventoryItem: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem', required: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    stock: { type: Number, required: true },
    threshold: { type: Number, required: true },
    unit: { type: String, default: 'unit' },
  },
  { _id: false }
);

const stockAlertSchema = new mongoose.Schema(
  {
    items: { type: [alertItemSchema], default: [] },
    channel: { type: String, enum: ['email'], default: 'email' },
    status: { type: String, enum: ['sent', 'failed', 'outbox'], default: 'sent' },
    recipient: { type: String, required: true },
    subject: { type: String, required: true },
    error: { type: String, default: '' },
    sentAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

stockAlertSchema.index({ createdAt: -1 });

export const StockAlert = mongoose.model('StockAlert', stockAlertSchema);
