import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: ['base', 'sauce', 'cheese', 'vegetable'],
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: '', trim: true, maxlength: 280 },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    unit: { type: String, default: 'unit', trim: true },
    lowStockThreshold: { type: Number, required: true, min: 0, default: 20 },
    emoji: { type: String, default: '🍕' },
    color: { type: String, default: '#FFC93C' },
    isAvailable: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    lastLowStockAlertAt: { type: Date, default: null },
  },
  { timestamps: true }
);

inventorySchema.index({ category: 1, sortOrder: 1 });

inventorySchema.methods.toPublic = function toPublic() {
  return {
    id: String(this._id),
    category: this.category,
    name: this.name,
    slug: this.slug,
    description: this.description,
    price: this.price,
    stock: this.stock,
    unit: this.unit,
    lowStockThreshold: this.lowStockThreshold,
    emoji: this.emoji,
    color: this.color,
    isAvailable: this.isAvailable,
    isLowStock: this.stock <= this.lowStockThreshold,
    sortOrder: this.sortOrder,
    updatedAt: this.updatedAt,
  };
};

export const InventoryItem = mongoose.model('InventoryItem', inventorySchema);
