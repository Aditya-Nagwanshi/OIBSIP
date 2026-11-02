import { statusLabel } from '../../lib/format';

export default function StatusBadge({ status, label }) {
  return (
    <span className={`order-status order-status--${status}`}>
      {label || statusLabel(status)}
    </span>
  );
}
