import { Link } from 'react-router-dom';

export function PizzaMark({ size = 46 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M24 5 42 39.5c1.3 2.4-.7 5.2-3.3 4.2L24 36 9.3 43.7c-2.6 1-4.6-1.8-3.3-4.2L24 5Z" fill="currentColor" />
      <path d="M24 36 38.7 43.7c2.6 1 4.6-1.8 3.3-4.2L26.9 12.6 24 36Z" fill="#E7334A" />
      <circle cx="21" cy="22" r="3.2" fill="#E7334A" />
      <circle cx="29.5" cy="31" r="2.6" fill="#E7334A" />
      <circle cx="18" cy="32" r="1.9" fill="#4E8D3A" />
      <circle cx="28" cy="18" r="2" fill="#4E8D3A" />
    </svg>
  );
}

export default function Logo({ light = false, showSub = true, to = '/', className = '' }) {
  return (
    <Link to={to} className={`logo ${className}`} aria-label="Slice Theory home">
      <span className="logo__mark">
        <PizzaMark size={31} />
      </span>
      <span className="logo__text">
        <span>
          Slice <em>Theory</em>
        </span>
        {showSub ? <small className="logo__sub">More than pizza</small> : null}
      </span>
    </Link>
  );
}
