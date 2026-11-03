import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, CheckCircle2, ChefHat, LogOut, MailCheck, MapPin, Pizza, RefreshCw, ShoppingBag, Sparkles, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { formatDate, formatINR, initials, shortAddress, timeAgo } from '../lib/format';
import api from '../lib/api';
import PageLoader from '../components/ui/PageLoader';
import StatusBadge from '../components/ui/StatusBadge';
import DashboardBand from '../components/dashboard/DashboardBand';
import usePageTitle from '../hooks/usePageTitle';
import { useToast } from '../contexts/ToastContext';

export default function DashboardPage() {
  usePageTitle('My orders');
  const { user, logout, refreshUser } = useAuth();
  const { socket, connected } = useSocket();
  const { toast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resending, setResending] = useState(false);
  const [verifyUrl, setVerifyUrl] = useState('');
  const [resendNote, setResendNote] = useState('');

  const loadOrders = async () => {
    try {
      const data = await api('/orders');
      setOrders(data.orders || []);
      setError('');
    } catch (caught) {
      if (caught.code === 'EMAIL_UNVERIFIED') setError('');
      else setError(caught.message || 'Could not load your orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    refreshUser();
  }, []);

  useEffect(() => {
    if (!socket) return undefined;
    const handler = ({ order }) => {
      if (!order) return;
      setOrders((current) => {
        const exists = current.some((entry) => entry.id === order.id);
        return exists ? current.map((entry) => (entry.id === order.id ? order : entry)) : [order, ...current];
      });
    };
    socket.on('order:updated', handler);
    socket.on('order:created', handler);
    return () => {
      socket.off('order:updated', handler);
      socket.off('order:created', handler);
    };
  }, [socket]);

  const stats = useMemo(() => {
    const paid = orders.filter((order) => order.payment?.status === 'paid');
    const spent = paid.reduce((sum, order) => sum + order.pricing.total, 0);
    const active = orders.filter((order) => ['received', 'in_kitchen', 'out_for_delivery', 'payment_pending'].includes(order.status));
    return { total: paid.length, spent, active: active.length };
  }, [orders]);

  const resend = async () => {
    setResending(true);
    setVerifyUrl('');
    setResendNote('');
    try {
      const data = await api('/auth/resend-verification', { method: 'POST', body: { email: user.email }, token: null });
      setResendNote(data.message);
      if (data.devVerifyUrl) setVerifyUrl(data.devVerifyUrl);
    } catch (caught) {
      setResendNote(caught.message);
    } finally {
      setResending(false);
    }
  };

  const signOut = () => {
    logout();
    toast('Signed out. Your cart is still waiting on this device.', { tone: 'info' });
  };

  if (loading) return <PageLoader label="Fetching your theories" />;

  return (
    <section className="dashboard">
      <div className="container">
        <div className="dashboard__head">
          <div>
            <p className="eyebrow">Your slice lab</p>
            <h1>
              Hey, <em>{user?.name?.split(' ')[0] || 'theorist'}.</em>
            </h1>
            <p>Your orders, your theories and your next very good decision.</p>
          </div>
          <div className="dashboard__head-actions">
            <Link to="/menu" className="btn">Order again <ArrowRight size={16} /></Link>
            <Link to="/build" className="btn btn--ghost">Build a new one</Link>
          </div>
        </div>

        {!user?.isVerified ? (
          <div className="notice notice--warning dashboard__verify">
            <MailCheck size={19} />
            <div>
              <strong>Verify your email to unlock ordering.</strong>
              <p>{resendNote || 'We sent a link when you registered. Need a fresh one? Resend it below.'}</p>
              {verifyUrl ? <a className="notice__link" href={verifyUrl}>Open the demo verification link</a> : null}
            </div>
            <button className="btn btn--sm" onClick={resend} disabled={resending}>
              {resending ? <RefreshCw size={14} className="spin" /> : null}
              {resending ? 'Sending…' : 'Resend link'}
            </button>
          </div>
        ) : (
          <div className="dashboard__verified">
            <CheckCircle2 size={14} /> Email verified · {connected ? 'live updates connected' : 'live updates reconnecting'}
          </div>
        )}

        <div className="dashboard__stats">
          <div className="dash-stat">
            <span className="dash-stat__icon dash-stat__icon--yellow"><ShoppingBag size={19} /></span>
            <div><strong>{stats.total}</strong><span>Paid orders</span></div>
          </div>
          <div className="dash-stat">
            <span className="dash-stat__icon dash-stat__icon--green"><TrendingUp size={19} /></span>
            <div><strong>{formatINR(stats.spent)}</strong><span>Invested in research</span></div>
          </div>
          <div className="dash-stat">
            <span className="dash-stat__icon dash-stat__icon--pink"><ChefHat size={19} /></span>
            <div><strong>{stats.active}</strong><span>Active right now</span></div>
          </div>
          <div className="dash-stat">
            <span className="dash-stat__icon dash-stat__icon--purple"><Pizza size={19} /></span>
            <div><strong>{orders.length ? orders[0].items[0]?.name?.split(' ')[0] : '—'}</strong><span>Last theory</span></div>
          </div>
        </div>

        <DashboardBand
          firstName={user?.name?.split(' ')[0] || 'theorist'}
          activeCount={stats.active}
        />

        <div className="dashboard__grid">
          <div className="dashboard__orders">
            <div className="dashboard__section-head">
              <h2>Order history</h2>
              <button className="link-arrow" onClick={loadOrders}><RefreshCw size={14} /> Refresh</button>
            </div>

            {error ? <div className="notice notice--warning"><p>{error}</p></div> : null}

            {!orders.length ? (
              <div className="empty-state empty-state--card">
                <span className="empty-state__icon"><Pizza size={28} /></span>
                <h3>No theories tested yet.</h3>
                <p>Your first order is the most important experiment. Choose a starting point.</p>
                <div className="empty-state__actions">
                  <Link to="/menu" className="btn">Browse the menu</Link>
                  <Link to="/build" className="btn btn--ghost">Build your own</Link>
                </div>
              </div>
            ) : (
              <div className="order-list">
                {orders.map((order) => (
                  <article className="order-row" key={order.id}>
                    <div className="order-row__media">
                      {order.items.slice(0, 2).map((item, index) => (
                        <img key={item.id} src={item.image} alt={item.name} style={{ zIndex: 2 - index }} loading="lazy" />
                      ))}
                    </div>
                    <div className="order-row__body">
                      <div className="order-row__top">
                        <div>
                          <h3>{order.items.map((item) => item.name).join(' + ')}</h3>
                          <p>#{order.orderNumber} · {formatDate(order.createdAt)}</p>
                        </div>
                        <StatusBadge status={order.status} label={order.statusLabel} />
                      </div>
                      <div className="order-row__meta">
                        <span>{order.items.reduce((sum, item) => sum + item.quantity, 0)} item(s)</span>
                        <span>·</span>
                        <span>{formatINR(order.pricing.total)}</span>
                        <span>·</span>
                        <span>{shortAddress(order.deliveryAddress).slice(0, 46)}…</span>
                      </div>
                      <div className="order-row__foot">
                        <span>{order.status === 'payment_pending' ? 'Payment pending' : `Updated ${timeAgo(order.updatedAt)}`}</span>
                        <Link to={`/orders/${order.id}`} className="link-arrow">
                          {order.status === 'payment_pending' ? 'Complete payment' : order.status === 'delivered' ? 'View receipt' : 'Track order'}
                          <ArrowRight size={14} />
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <aside className="dashboard__side">
            <div className="profile-card">
              <span className="profile-card__avatar">{initials(user?.name || 'ST')}</span>
              <h3>{user?.name || 'Slice Theorist'}</h3>
              <p>{user?.email}</p>
              <span className="profile-card__badge"><Sparkles size={12} /> Lab member</span>
              <div className="profile-card__meta">
                <span><CalendarDays size={13} /> Member since {formatDate(user?.createdAt, false)}</span>
                <span><MapPin size={13} /> Deliveries across the city</span>
              </div>
              <button className="btn btn--ghost btn--block" onClick={signOut}>
                <LogOut size={15} /> Sign out
              </button>
            </div>

            <div className="sidebar-promo">
              <span className="sidebar-promo__emoji">🍕</span>
              <h3>A theory worth sharing.</h3>
              <p>Send a Slice Theory box to someone whose day needs a 30-minute upgrade.</p>
              <Link to="/menu" className="link-arrow link-arrow--light">Pick a pizza <ArrowRight size={14} /></Link>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
