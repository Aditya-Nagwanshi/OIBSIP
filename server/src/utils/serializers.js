export function publicUser(user) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified,
    phone: user.phone || '',
    createdAt: user.createdAt,
  };
}

export function serializeInventoryItem(item) {
  return {
    id: String(item._id),
    category: item.category,
    name: item.name,
    slug: item.slug,
    description: item.description,
    price: item.price,
    stock: item.stock,
    unit: item.unit,
    lowStockThreshold: item.lowStockThreshold,
    emoji: item.emoji,
    color: item.color,
    isAvailable: item.isAvailable,
    isLowStock: item.stock <= item.lowStockThreshold,
    sortOrder: item.sortOrder,
    updatedAt: item.updatedAt,
  };
}

export function serializePizza(pizza) {
  return {
    id: String(pizza._id),
    slug: pizza.slug,
    name: pizza.name,
    description: pizza.description,
    tagline: pizza.tagline,
    image: pizza.image,
    accent: pizza.accent,
    basePrice: pizza.basePrice,
    rating: pizza.rating,
    reviewsCount: pizza.reviewsCount,
    isVegetarian: pizza.isVegetarian,
    spiceLevel: pizza.spiceLevel,
    badges: pizza.badges,
    calories: pizza.calories,
    prepMinutes: pizza.prepMinutes,
    featured: pizza.featured,
    isAvailable: pizza.isAvailable,
    recipe: pizza.recipe?.map((line) => ({
      inventoryItem: String(line.inventoryItem),
      slug: line.slug,
      name: line.name,
      category: line.category,
      quantity: line.quantity,
    })),
  };
}
