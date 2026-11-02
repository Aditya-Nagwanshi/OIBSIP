const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const inrDecimal = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatINR(value, decimal = false) {
  const amount = Number(value || 0);
  return decimal ? inrDecimal.format(amount) : inr.format(amount);
}

export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function formatDate(value, withTime = true) {
  if (!value) return '';
  const date = new Date(value);
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    ...(withTime ? { hour: 'numeric', minute: '2-digit' } : { year: 'numeric' }),
  });
}

export function timeAgo(value) {
  if (!value) return '';
  const seconds = Math.floor((Date.now() - new Date(value).getTime()) / 1000);
  if (seconds < 45) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} d ago`;
  return formatDate(value, false);
}

export function minutesUntil(value) {
  if (!value) return 0;
  return Math.max(0, Math.round((new Date(value).getTime() - Date.now()) / 60000));
}

export const ORDER_STEPS = [
  { key: 'received', label: 'Order Received', sub: 'Payment confirmed' },
  { key: 'in_kitchen', label: 'In Kitchen', sub: 'Dough meets fire' },
  { key: 'out_for_delivery', label: 'Sent to Delivery', sub: 'On the way' },
];

export function statusLabel(status) {
  return (
    {
      payment_pending: 'Awaiting Payment',
      received: 'Order Received',
      in_kitchen: 'In Kitchen',
      out_for_delivery: 'Sent to Delivery',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
    }[status] || status
  );
}

export function orderProgress(status) {
  const map = { payment_pending: -1, received: 0, in_kitchen: 1, out_for_delivery: 2, delivered: 3, cancelled: -1 };
  return map[status] ?? 0;
}

export function shortAddress(address) {
  if (!address) return '';
  return [address.line1, address.line2, address.city, address.state, address.pincode].filter(Boolean).join(', ');
}
