import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { CART_KEY, DEFAULT_CONFIG } from '../lib/constants';
import { useConfig } from './ConfigContext';

const CartContext = createContext(null);

const round = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;
const MAX_QTY = 10;

function readCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function makeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `line-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function sizeInfo(config, size) {
  const sizes = config?.sizes?.length ? config.sizes : DEFAULT_CONFIG.sizes;
  return sizes.find((item) => item.id === size) || sizes[1] || DEFAULT_CONFIG.sizes[1];
}

export function CartProvider({ children }) {
  const { config } = useConfig();
  const [items, setItems] = useState(readCart);
  const [isOpen, setOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items]);

  const openCart = () => setOpen(true);
  const closeCart = () => setOpen(false);

  const addLine = (line, { openDrawer = true, silent = false } = {}) => {
    setItems((current) => {
      const existing = current.find((item) => item.signature === line.signature);
      if (existing) {
        return current.map((item) =>
          item.id === existing.id
            ? { ...item, quantity: Math.min(MAX_QTY, item.quantity + line.quantity) }
            : item
        );
      }
      return [...current, line];
    });
    if (openDrawer) setOpen(true);
    return { added: true, name: line.name, silent };
  };

  const addPreset = (pizza, size = 'medium', quantity = 1, options = {}) => {
    const selectedSize = sizeInfo(config, size);
    const unitPrice = round(pizza.basePrice * selectedSize.multiplier);
    return addLine(
      {
        id: makeId(),
        signature: `preset:${pizza.id}:${size}`,
        kind: 'preset',
        pizzaId: pizza.id,
        name: pizza.name,
        description: pizza.description,
        image: pizza.image,
        size,
        sizeLabel: selectedSize.label,
        quantity,
        unitPrice,
        payload: { kind: 'preset', pizzaId: pizza.id, size, quantity },
      },
      options
    );
  };

  const addCustom = (build, options = {}) => {
    const selectedSize = sizeInfo(config, build.size);
    const toppings = [
      build.base,
      build.sauce,
      build.cheese,
      ...(build.vegetables || []),
    ].filter(Boolean);
    const toppingTotal = toppings.reduce((sum, option) => sum + Number(option.price || 0), 0);
    const unitPrice = round(toppingTotal * selectedSize.multiplier);
    const signature = `custom:${selectedSize.id}:${build.base?.id || ''}:${build.sauce?.id || ''}:${
      build.cheese?.id || ''
    }:${(build.vegetables || []).map((veg) => veg.id).sort().join(',')}`;

    return addLine(
      {
        id: makeId(),
        signature,
        kind: 'custom',
        name: 'Build Your Own',
        description: toppings.map((option) => option.name).join(' · '),
        image: '/media/pizzas/margherita.webp',
        size: selectedSize.id,
        sizeLabel: selectedSize.label,
        quantity: build.quantity || 1,
        unitPrice,
        payload: {
          kind: 'custom',
          size: selectedSize.id,
          quantity: build.quantity || 1,
          baseId: build.base?.id,
          sauceId: build.sauce?.id,
          cheeseId: build.cheese?.id,
          vegetableIds: (build.vegetables || []).map((veg) => veg.id),
        },
      },
      options
    );
  };

  const updateQuantity = (id, delta) => {
    setItems((current) =>
      current
        .map((item) =>
          item.id === id
            ? {
                ...item,
                quantity: Math.max(0, Math.min(MAX_QTY, item.quantity + delta)),
                payload: { ...item.payload, quantity: Math.max(0, Math.min(MAX_QTY, item.quantity + delta)) },
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const setQuantity = (id, quantity) => {
    const next = Math.max(0, Math.min(MAX_QTY, Number(quantity) || 0));
    setItems((current) =>
      current
        .map((item) =>
          item.id === id
            ? { ...item, quantity: next, payload: { ...item.payload, quantity: next } }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (id) => setItems((current) => current.filter((item) => item.id !== id));
  const clearCart = () => setItems([]);

  const totals = useMemo(() => {
    const subtotal = round(items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0));
    const taxRate = config.taxRate ?? DEFAULT_CONFIG.taxRate;
    const deliveryThreshold = config.freeDeliveryThreshold ?? DEFAULT_CONFIG.freeDeliveryThreshold;
    const deliveryFee = config.deliveryFee ?? DEFAULT_CONFIG.deliveryFee;
    const tax = round(subtotal * taxRate);
    const delivery = subtotal === 0 || subtotal >= deliveryThreshold ? 0 : deliveryFee;
    const total = round(subtotal + tax + delivery);
    return {
      subtotal,
      tax,
      delivery,
      total,
      deliveryThreshold,
      amountToFreeDelivery: Math.max(0, round(deliveryThreshold - subtotal)),
    };
  }, [items, config]);

  const orderItems = useMemo(
    () =>
      items.map((item) => {
        const { quantity } = item;
        return { ...item.payload, quantity };
      }),
    [items]
  );

  const value = {
    items,
    count: items.reduce((sum, item) => sum + item.quantity, 0),
    isOpen,
    openCart,
    closeCart,
    addPreset,
    addCustom,
    updateQuantity,
    setQuantity,
    removeItem,
    clearCart,
    totals,
    orderItems,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside CartProvider');
  return context;
}
