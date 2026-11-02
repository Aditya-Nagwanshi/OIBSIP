import { useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Boxes, LayoutDashboard, LogOut, Radio, ReceiptText, ShieldCheck } from 'lucide-react';
import Logo from '../ui/Logo';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { useToast } from '../../contexts/ToastContext';

const links = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/orders', label: 'Live orders', icon: ReceiptText },
  { to: '/admin/inventory', label: 'Inventory', icon: Boxes },
  { to: '/admin/alerts', label: 'Stock alerts', icon: AlertTriangle },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { socket, connected } = useSocket();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const label = links.find((link) => (link.end ? location.pathname === link.to : location.pathname.startsWith(link.to)))?.label;
    document.title = `${label || 'Admin'} · Slice Theory Admin`;
  }, [location.pathname]);

  useEffect(() => {
    if (!socket) return undefined;
    const onOrder = ({ order }) => {
      if (!order) return;
      toast(`${order.orderNumber} · ${order.statusLabel}`, { tone: 'info', title: 'Order update' });
    };
    const onLow = ({ items }) => {
      toast(`${items?.length || 'Some'} ingredient(s) are running low.`, { tone: 'error', title: 'Stock alert' });
    };
    socket.on('order:new', onOrder);
    socket.on('inventory:low', onLow);
    return () => {
      socket.off('order:new', onOrder);
      socket.off('inventory:low', onLow);
    };
  }, [socket, toast]);

  const signOut = () => {
    logout();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          <Logo light to="/admin" />
          <span className="admin-sidebar__tag">Admin Studio</span>
        </div>
        <nav className="admin-nav">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink key={link.to} to={link.to} end={link.end} className={({ isActive }) => (isActive ? 'is-active' : '')}>
                <Icon size={17} />
                {link.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="admin-sidebar__foot">
          <div className="admin-live">
            <Radio size={14} />
            <span className={`live-dot ${connected ? 'is-on' : ''}`} />
            {connected ? 'Realtime connected' : 'Reconnecting…'}
          </div>
          <Link to="/" className="admin-sidebar__link"><ArrowLeft size={14} /> View storefront</Link>
          <button className="admin-sidebar__link" onClick={signOut}><LogOut size={14} /> Sign out</button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div>
            <p className="admin-topbar__eyebrow"><ShieldCheck size={13} /> Passwordless demo admin</p>
            <h2>{user?.name || 'Slice Theory Admin'}</h2>
          </div>
          <div className="admin-topbar__right">
            <span className="admin-topbar__email">{user?.email}</span>
            <span className="admin-topbar__date">
              {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
            </span>
          </div>
        </header>
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
