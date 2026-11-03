export const roundMoney = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

export const SIZE_MULTIPLIERS = {
  regular: 0.85,
  medium: 1,
  large: 1.25,
};

export const SIZE_LABELS = {
  regular: 'Regular 8"',
  medium: 'Medium 11"',
  large: 'Large 14"',
};

export const TAX_RATE = 0.05;
export const DELIVERY_FEE = 49;
export const FREE_DELIVERY_THRESHOLD = 599;

export const COUPONS = {
  INFOBYTE: {
    code: 'INFOBYTE',
    percent: 40,
    label: 'InfoByte special — 40% off',
  },
};

export function resolveCoupon(code) {
  const normalized = String(code || '').trim().toUpperCase();
  if (!normalized) return null;
  return COUPONS[normalized] || null;
}
