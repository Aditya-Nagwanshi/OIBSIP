import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu as MenuIcon,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  X,
} from 'lucide-react';
import Logo from '../ui/Logo';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { initials } from '../../lib/format';

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/menu', label: 'Menu' },
  { to: '/#story', label: 'Our Story' },
  { to: '/build', label: 'Build Yours' },
  { to: '/dashboard', label: 'My Orders' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const { count, openCart } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.classList.toggle('no-scroll', menuOpen);
    return () => document.body.classList.remove('no-scroll');
  }, [menuOpen]);

  const isActive = (to, end) => {
    if (to.startsWith('/#')) return false;
    return end ? location.pathname === to : location.pathname.startsWith(to);
  };

  const handleSignOut = () => {
    logout();
    setMenuOpen(false);
    navigate('/');
  };

  return (
    <>
      <header className={`site-header ${scrolled ? 'is-scrolled' : ''}`}>
        <div className="container nav-shell">
          <Logo />
          <nav className="nav-links" aria-label="Main navigation">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={`nav-link ${isActive(link.to, link.end) ? 'active' : ''}`}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="nav-actions">
            <button className="icon-btn nav-cart" onClick={openCart} aria-label={`Open cart with ${count} items`}>
              <ShoppingBag size={19} />
              {count > 0 ? <span className="nav-cart__count">{count}</span> : null}
            </button>
            {isAuthenticated ? (
              <Link to="/dashboard" className="nav-user" aria-label="Open your account">
                <span className="avatar">{initials(user?.name) || 'ST'}</span>
                <span>{user?.name?.split(' ')[0] || 'My account'}</span>
              </Link>
            ) : (
              <Link to="/login" className="btn btn--ghost btn--sm nav-signin">
                <LogIn size={15} />
                Sign in
              </Link>
            )}
            <Link to="/menu" className="btn btn--sm nav-order">
              Order Now
              <ArrowRight size={15} />
            </Link>
            <button
              className="icon-btn mobile-menu"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((value) => !value)}
            >
              {menuOpen ? <X size={20} /> : <MenuIcon size={20} />}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen ? (
          <motion.div
            className="mobile-menu-panel"
            initial={{ opacity: 0, y: -18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            <div className="container">
              <nav className="mobile-menu-links" aria-label="Mobile navigation">
                {links.map((link, index) => (
                  <motion.div
                    key={link.to}
                    initial={{ opacity: 0, x: -14 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.04 + index * 0.04 }}
                  >
                    <Link
                      to={link.to}
                      className={`mobile-menu-link ${isActive(link.to, link.end) ? 'is-active' : ''}`}
                    >
                      <span>{String(index + 1).padStart(2, '0')}</span>
                      {link.label}
                      <ArrowRight size={19} />
                    </Link>
                  </motion.div>
                ))}
              </nav>
              <div className="mobile-menu-actions">
                {isAuthenticated ? (
                  <>
                    <Link to="/dashboard" className="btn btn--purple btn--block">
                      <LayoutDashboard size={17} />
                      {user?.name?.split(' ')[0] || 'My account'}
                    </Link>
                    <button className="btn btn--ghost btn--block" onClick={handleSignOut}>
                      <LogOut size={16} />
                      Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="btn btn--purple btn--block">
                      <LogIn size={17} />
                      Sign in
                    </Link>
                    <Link to="/register" className="btn btn--ghost btn--block">
                      <Sparkles size={16} />
                      Create account
                    </Link>
                  </>
                )}
                <Link to="/admin" className="mobile-admin-link">
                  <ShieldCheck size={15} />
                  Admin Studio · bottom of app
                </Link>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
