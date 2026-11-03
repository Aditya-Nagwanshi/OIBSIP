export const DEFAULT_CONFIG = {
  brand: 'Slice Theory',
  currency: 'INR',
  payments: { mode: 'mock', keyId: null },
  taxRate: 0.05,
  deliveryFee: 49,
  freeDeliveryThreshold: 599,
  coupons: [{ code: 'INFOBYTE', percent: 40, label: 'InfoByte special — 40% off' }],
  sizes: [
    { id: 'regular', multiplier: 0.85, label: 'Regular 8"' },
    { id: 'medium', multiplier: 1, label: 'Medium 11"' },
    { id: 'large', multiplier: 1.25, label: 'Large 14"' },
  ],
  admin: { email: 'Demo_SliceTheory@pizza', passwordless: true },
};

export const CART_KEY = 'slice_theory_cart_v1';
export const ADDRESS_KEY = 'slice_theory_address_v1';
export const USER_KEY = 'slice_theory_user';

export const SIZE_ORDER = ['regular', 'medium', 'large'];

export const MENU_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/menu', label: 'Menu' },
  { to: '/#story', label: 'Our Story' },
  { to: '/build', label: 'Build Yours' },
  { to: '/dashboard', label: 'My Orders' },
];
