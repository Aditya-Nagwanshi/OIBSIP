import mongoose from 'mongoose';

const recipeLineSchema = new mongoose.Schema(
  {
    inventoryItem: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem', required: true },
    slug: { type: String, required: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0.5, default: 1 },
  },
  { _id: false }
);

const pizzaSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true, maxlength: 400 },
    tagline: { type: String, default: '', trim: true },
    image: { type: String, required: true },
    accent: { type: String, default: '#FFC93C' },
    basePrice: { type: Number, required: true, min: 0 },
    rating: { type: Number, default: 4.8, min: 0, max: 5 },
    reviewsCount: { type: Number, default: 0, min: 0 },
    isVegetarian: { type: Boolean, default: true },
    spiceLevel: { type: Number, default: 1, min: 0, max: 3 },
    badges: { type: [String], default: [] },
    calories: { type: Number, default: 850 },
    prepMinutes: { type: Number, default: 18 },
    featured: { type: Boolean, default: false },
    isAvailable: { type: Boolean, default: true },
    recipe: { type: [recipeLineSchema], default: [] },
  },
  { timestamps: true }
);

export const Pizza = mongoose.model('Pizza', pizzaSchema);
