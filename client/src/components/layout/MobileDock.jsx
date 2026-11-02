import { NavLink } from 'react-router-dom';
import { House, ReceiptText, ShieldCheck, UtensilsCrossed, WandSparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const items = [
  { to: '/', label: 'Home', icon: House, end: true },
  { to: '/menu', label: 'Menu', icon: UtensilsCrossed },
  { to: '/build', label: 'Build', icon: WandSparkles },
  { to: '/dashboard', label: 'Orders', icon: ReceiptText },
];

export default function MobileDock() {
  const { isAdmin } = useAuth();

  return (
    <nav className="mobile-dock" aria-label="Quick navigation">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `mobile-dock__item ${isActive ? 'active' : ''}`}
          >
            <Icon />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
      <NavLink
        to={isAdmin ? '/admin' : '/admin/login'}
        className={({ isActive }) => `mobile-dock__item ${isActive ? 'active' : ''}`}
      >
        <ShieldCheck />
        <span>Admin</span>
      </NavLink>
    </nav>
  );
}
