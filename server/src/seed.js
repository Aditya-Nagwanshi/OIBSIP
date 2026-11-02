import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from './config/db.js';
import { env } from './config/env.js';
import { InventoryItem } from './models/InventoryItem.js';
import { Pizza } from './models/Pizza.js';
import { User } from './models/User.js';

const inventory = [
  { category: 'base', name: 'Classic Hand Tossed', slug: 'classic-hand-tossed', description: 'Airy, hand-stretched dough with a golden, pillowy rim.', price: 149, stock: 85, unit: 'base', lowStockThreshold: 20, emoji: '🥖', color: '#E8B66A', sortOrder: 1 },
  { category: 'base', name: 'Thin & Crispy', slug: 'thin-crust', description: 'A snappy, paper-thin crust that lets the toppings sing.', price: 129, stock: 62, unit: 'base', lowStockThreshold: 20, emoji: '🍕', color: '#D79B53', sortOrder: 2 },
  { category: 'base', name: 'Cheese Burst', slug: 'cheese-burst', description: 'A molten cheese pocket tucked into every golden edge.', price: 199, stock: 40, unit: 'base', lowStockThreshold: 15, emoji: '🧀', color: '#F6C447', sortOrder: 3 },
  { category: 'base', name: 'Whole Wheat', slug: 'whole-wheat', description: 'Stone-milled whole wheat for a nutty, hearty bite.', price: 159, stock: 12, unit: 'base', lowStockThreshold: 15, emoji: '🌾', color: '#C9A76B', sortOrder: 4 },
  { category: 'base', name: 'Garlic Bread Base', slug: 'garlic-bread-base', description: 'Buttery garlic edges, crisp underneath, impossible to share.', price: 179, stock: 24, unit: 'base', lowStockThreshold: 12, emoji: '🧄', color: '#EFD08B', sortOrder: 5 },

  { category: 'sauce', name: 'Classic Tomato', slug: 'classic-tomato', description: 'Slow-cooked San Marzano tomatoes, basil and olive oil.', price: 49, stock: 120, unit: 'portion', lowStockThreshold: 30, emoji: '🍅', color: '#E4503C', sortOrder: 1 },
  { category: 'sauce', name: 'Basil Pesto', slug: 'basil-pesto', description: 'Bright basil, toasted pine nuts and parmesan.', price: 79, stock: 35, unit: 'portion', lowStockThreshold: 15, emoji: '🌿', color: '#5C9A3A', sortOrder: 2 },
  { category: 'sauce', name: 'Smoky BBQ', slug: 'smoky-bbq', description: 'Sweet-smoke molasses with a gentle chili kick.', price: 69, stock: 28, unit: 'portion', lowStockThreshold: 15, emoji: '🔥', color: '#9A4B2C', sortOrder: 3 },
  { category: 'sauce', name: 'Peri-Peri', slug: 'peri-peri', description: 'Fiery African bird-eye chili and roasted garlic.', price: 69, stock: 18, unit: 'portion', lowStockThreshold: 15, emoji: '🌶️', color: '#D63A2A', sortOrder: 4 },
  { category: 'sauce', name: 'White Alfredo', slug: 'white-alfredo', description: 'Silky cream, cracked pepper and a whisper of nutmeg.', price: 89, stock: 26, unit: 'portion', lowStockThreshold: 12, emoji: '🥛', color: '#F2E4C8', sortOrder: 5 },

  { category: 'cheese', name: 'Fresh Mozzarella', slug: 'mozzarella', description: 'Stretchy, milky mozzarella made for the perfect pull.', price: 89, stock: 140, unit: 'portion', lowStockThreshold: 30, emoji: '🧀', color: '#F7D16E', sortOrder: 1 },
  { category: 'cheese', name: 'Sharp Cheddar', slug: 'sharp-cheddar', description: 'Aged cheddar with a tangy, savoury edge.', price: 109, stock: 22, unit: 'portion', lowStockThreshold: 20, emoji: '🧀', color: '#E8A73E', sortOrder: 2 },
  { category: 'cheese', name: 'Parmesan', slug: 'parmesan', description: 'Nutty, crystalline parmesan shaved thin.', price: 119, stock: 45, unit: 'portion', lowStockThreshold: 15, emoji: '🧀', color: '#E8CD8A', sortOrder: 3 },
  { category: 'cheese', name: 'Vegan Cheddar', slug: 'vegan-cheddar', description: 'Plant-based, dairy-free and properly melty.', price: 139, stock: 14, unit: 'portion', lowStockThreshold: 10, emoji: '🌱', color: '#E5C96B', sortOrder: 4 },
  { category: 'cheese', name: 'Four-Cheese Blend', slug: 'four-cheese-blend', description: 'Mozzarella, cheddar, parmesan and smoky gouda.', price: 159, stock: 38, unit: 'portion', lowStockThreshold: 15, emoji: '🧀', color: '#F0C64F', sortOrder: 5 },

  { category: 'vegetable', name: 'Red Onion', slug: 'red-onion', description: 'Sweet, ribbon-cut red onion.', price: 39, stock: 160, unit: 'portion', lowStockThreshold: 30, emoji: '🧅', color: '#C97A9B', sortOrder: 1 },
  { category: 'vegetable', name: 'Capsicum', slug: 'capsicum', description: 'Crunchy tricolour bell peppers.', price: 49, stock: 120, unit: 'portion', lowStockThreshold: 30, emoji: '🫑', color: '#5EA447', sortOrder: 2 },
  { category: 'vegetable', name: 'Sweet Corn', slug: 'sweet-corn', description: 'Golden kernels with a little char.', price: 39, stock: 110, unit: 'portion', lowStockThreshold: 30, emoji: '🌽', color: '#F2C544', sortOrder: 3 },
  { category: 'vegetable', name: 'Forest Mushroom', slug: 'mushroom', description: 'Earthy button mushrooms, sliced and roasted.', price: 59, stock: 70, unit: 'portion', lowStockThreshold: 20, emoji: '🍄', color: '#B08A6A', sortOrder: 4 },
  { category: 'vegetable', name: 'Black Olives', slug: 'black-olives', description: 'Briney black olives, sliced into rings.', price: 59, stock: 65, unit: 'portion', lowStockThreshold: 20, emoji: '🫒', color: '#4A3A3F', sortOrder: 5 },
  { category: 'vegetable', name: 'Jalapeño', slug: 'jalapeno', description: 'Pickled heat with a bright, vinegary snap.', price: 49, stock: 80, unit: 'portion', lowStockThreshold: 20, emoji: '🌶️', color: '#5E8B37', sortOrder: 6 },
  { category: 'vegetable', name: 'Cherry Tomato', slug: 'cherry-tomato', description: 'Jammy, blistered cherry tomatoes.', price: 59, stock: 8, unit: 'portion', lowStockThreshold: 10, emoji: '🍅', color: '#E4503C', sortOrder: 7 },
  { category: 'vegetable', name: 'Baby Spinach', slug: 'baby-spinach', description: 'Tender leaves that crisp at the edges.', price: 49, stock: 55, unit: 'portion', lowStockThreshold: 15, emoji: '🥬', color: '#4E8D3A', sortOrder: 8 },
  { category: 'vegetable', name: 'Paneer Cubes', slug: 'paneer', description: 'Soft cottage-cheese cubes marinated in tikka spice.', price: 79, stock: 60, unit: 'portion', lowStockThreshold: 15, emoji: '🧈', color: '#F3E3C2', sortOrder: 9 },
  { category: 'vegetable', name: 'Smoked Pepperoni', slug: 'smoked-pepperoni', description: 'Crispy-edged, smoky pepperoni cups.', price: 99, stock: 75, unit: 'portion', lowStockThreshold: 20, emoji: '🍖', color: '#B33A2B', sortOrder: 10 },
  { category: 'vegetable', name: 'Herb Chicken', slug: 'herb-chicken', description: 'Tender chicken tossed in oregano and garlic.', price: 109, stock: 48, unit: 'portion', lowStockThreshold: 15, emoji: '🍗', color: '#D3A15A', sortOrder: 11 },
  { category: 'vegetable', name: 'Fresh Basil', slug: 'fresh-basil', description: 'Fragrant basil picked for the finish.', price: 29, stock: 44, unit: 'portion', lowStockThreshold: 12, emoji: '🌿', color: '#4E8D3A', sortOrder: 12 },
];

const pizzas = [
  {
    slug: 'classic-margherita', name: 'Classic Margherita', tagline: 'The one that started it all', description: 'Slow-cooked tomato, milky mozzarella and fresh basil on a hand-tossed crust.',
    image: '/media/margherita.webp', accent: '#E7334A', basePrice: 299, rating: 4.9, reviewsCount: 2140, isVegetarian: true, spiceLevel: 0,
    badges: ['Bestseller', 'Vegetarian'], calories: 820, prepMinutes: 16, featured: true,
    recipe: [['classic-hand-tossed', 1], ['classic-tomato', 1], ['mozzarella', 1], ['fresh-basil', 1]],
  },
  {
    slug: 'pepperoni-fiesta', name: 'Pepperoni Fiesta', tagline: 'Crispy cups, big pull', description: 'Double smoked pepperoni, molten mozzarella and a classic tomato base.',
    image: '/media/pepperoni.webp', accent: '#D93A2B', basePrice: 399, rating: 4.8, reviewsCount: 1836, isVegetarian: false, spiceLevel: 1,
    badges: ['Fan favourite'], calories: 1080, prepMinutes: 18, featured: true,
    recipe: [['classic-hand-tossed', 1], ['classic-tomato', 1], ['mozzarella', 1], ['smoked-pepperoni', 2]],
  },
  {
    slug: 'veggie-delight', name: 'Veggie Delight', tagline: 'Garden party on a crust', description: 'Basil pesto, onion, capsicum, sweet corn and forest mushrooms with mozzarella.',
    image: '/media/margherita.webp', accent: '#4E8D3A', basePrice: 349, rating: 4.7, reviewsCount: 1275, isVegetarian: true, spiceLevel: 0,
    badges: ['Vegetarian', 'Fresh pick'], calories: 760, prepMinutes: 17, featured: true,
    recipe: [['thin-crust', 1], ['basil-pesto', 1], ['mozzarella', 1], ['red-onion', 1], ['capsicum', 1], ['sweet-corn', 1], ['mushroom', 1]],
  },
  {
    slug: 'paneer-tikka', name: 'Paneer Tikka', tagline: 'Desi smoke, cheese pull', description: 'Tikka-marinated paneer, red onion, capsicum and mozzarella on classic dough.',
    image: '/media/margherita.webp', accent: '#E85D2A', basePrice: 379, rating: 4.8, reviewsCount: 1512, isVegetarian: true, spiceLevel: 2,
    badges: ['Vegetarian', 'Spicy-ish'], calories: 930, prepMinutes: 19, featured: false,
    recipe: [['classic-hand-tossed', 1], ['classic-tomato', 1], ['mozzarella', 1], ['paneer', 1], ['capsicum', 1], ['red-onion', 1]],
  },
  {
    slug: 'chicken-fiesta', name: 'Chicken Fiesta', tagline: 'Smoky, saucy, stacked', description: 'Herb chicken, jalapeño, red onion and mozzarella over smoky BBQ sauce.',
    image: '/media/pepperoni.webp', accent: '#8A4B22', basePrice: 449, rating: 4.9, reviewsCount: 1688, isVegetarian: false, spiceLevel: 2,
    badges: ['High protein', 'Chef pick'], calories: 1120, prepMinutes: 20, featured: false,
    recipe: [['cheese-burst', 1], ['smoky-bbq', 1], ['mozzarella', 1], ['herb-chicken', 2], ['jalapeno', 1], ['red-onion', 1]],
  },
  {
    slug: 'four-cheese-dream', name: 'Four Cheese Dream', tagline: 'A blanket of molten cheese', description: 'Mozzarella, sharp cheddar, parmesan and smoked gouda on white alfredo.',
    image: '/media/oven.webp', accent: '#D8A62E', basePrice: 429, rating: 4.7, reviewsCount: 940, isVegetarian: true, spiceLevel: 0,
    badges: ['Vegetarian', 'Extra cheesy'], calories: 1180, prepMinutes: 18, featured: false,
    recipe: [['thin-crust', 1], ['white-alfredo', 1], ['mozzarella', 1], ['sharp-cheddar', 1], ['parmesan', 1], ['four-cheese-blend', 1]],
  },
];

export async function seedDatabase({ quiet = false } = {}) {
  const log = (...args) => {
    if (!quiet) console.log(...args);
  };

  for (const item of inventory) {
    await InventoryItem.updateOne(
      { slug: item.slug },
      { $setOnInsert: item },
      { upsert: true }
    );
  }
  log(`[seed] Inventory ready (${inventory.length} items).`);

  const allItems = await InventoryItem.find({});
  const bySlug = new Map(allItems.map((item) => [item.slug, item]));

  for (const pizza of pizzas) {
    const recipe = pizza.recipe.map(([slug, quantity]) => {
      const item = bySlug.get(slug);
      if (!item) throw new Error(`Seed inventory item missing: ${slug}`);
      return {
        inventoryItem: item._id,
        slug: item.slug,
        name: item.name,
        category: item.category,
        quantity,
      };
    });
    const { recipe: _recipe, ...rest } = pizza;
    await Pizza.updateOne(
      { slug: pizza.slug },
      { $set: { ...rest, recipe } },
      { upsert: true }
    );
  }
  log(`[seed] Pizza menu ready (${pizzas.length} pizzas).`);

  await User.updateOne(
    { email: env.adminEmail },
    {
      $set: { role: 'admin', isVerified: true },
      $setOnInsert: { name: 'Slice Theory Admin' },
    },
    { upsert: true }
  );
  log(`[seed] Admin access ready for ${env.adminEmail} (passwordless demo mode).`);

  return { inventoryCount: allItems.length, pizzaCount: pizzas.length };
}

const isDirectRun = process.argv[1] && process.argv[1].endsWith('seed.js');

if (isDirectRun) {
  try {
    await connectDatabase();
    await seedDatabase();
    await disconnectDatabase();
    console.log('[seed] Done.');
    process.exit(0);
  } catch (error) {
    console.error('[seed] Failed:', error);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}
