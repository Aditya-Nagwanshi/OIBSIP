import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, ArrowUpRight, Boxes, ChefHat, CircleDollarSign, ShoppingBag, Timer, TrendingUp, Users } from 'lucide-react';
import api from '../../lib/api';
import { formatINR, timeAgo } from '../../lib/format';
import { useSocket } from '../../contexts/SocketContext';
import StatusBadge from '../../components/ui/StatusBadge';
import PageLoader from '../../components/ui/PageLoader';
import { useToast } from '../../contexts/ToastContext';

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { socket } = useSocket();
  const { toast } = useToast();

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await api('/admin/stats');
      setData(response);
      setError('');
    } catch (caught) {
      if (!silent) setError(caught.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!socket) return undefined;
    let timer;
    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(() => load(true), 700);
    };
    socket.on('order:new', schedule);
    socket.on('order:updated', schedule);
    socket.on('inventory:updated', schedule);
    socket.on('inventory:low', (payload) => {
      toast(`${payload?.items?.length || 'Some'} ingredient(s) just dropped below threshold.`, { tone: 'error', title: 'Low stock' });
      schedule();
    });
    return () => {
      clearTimeout(timer);
      socket.off('order:new', schedule);
      socket.off('order:updated', schedule);
      socket.off('inventory:updated', schedule);
      socket.off('inventory:low');
    };
  }, [socket, load, toast]);

  if (loading) return <PageLoader label="Reading the kitchen metrics" />;
  if (error) {
    return (
      <div className="admin-error">
        <AlertTriangle size={24} />
        <h2>Metrics are unavailable.</h2>
        <p>{error}</p>
        <button className="btn" onClick={() => load()}>Try again</button>
      </div>
    );
  }

  const { stats, weekly, topPizzas, lowStock, recentOrders, statusCounts } = data;
  const maxRevenue = Math.max(1, ...weekly.map((day) => day.revenue));
  const maxTop = Math.max(1, ...topPizzas.map((pizza) => pizza.quantity));

  const cards = [
    { label: 'Total revenue', value: formatINR(stats.revenue), icon: CircleDollarSign, tone: 'yellow', note: `${formatINR(stats.averageOrderValue)} average order` },
    { label: 'Orders today', value: stats.ordersToday, icon: ShoppingBag, tone: 'pink', note: `${stats.totalOrders} all time` },
    { label: 'Active orders', value: stats.activeOrders, icon: Timer, tone: 'green', note: `${stats.deliveredOrders} delivered` },
    { label: 'Customers', value: stats.totalCustomers, icon: Users, tone: 'purple', note: 'Verified lab members' },
  ];

  return (
    <div className="admin-page">
      <div className="admin-page__head">
        <div>
          <p className="eyebrow">Kitchen overview</p>
          <h1>Good service, <em>chef.</em></h1>
          <p>Here is what the oven has been up to in the last seven days.</p>
        </div>
        <Link to="/admin/orders" className="btn">Open live orders <ArrowRight size={16} /></Link>
      </div>

      <div className="admin-stat-grid">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <article className={`admin-stat admin-stat--${card.tone}`} key={card.label}>
              <span className="admin-stat__icon"><Icon size={20} /></span>
              <div>
                <span>{card.label}</span>
                <strong>{card.value}</strong>
                <small>{card.note}</small>
              </div>
            </article>
          );
        })}
      </div>

      <div className="admin-dash-grid">
        <section className="admin-panel admin-panel--chart">
          <div className="admin-panel__head">
            <div>
              <h2>Revenue this week</h2>
              <p>Paid orders only, cancellation-safe.</p>
            </div>
            <span className="admin-panel__badge"><TrendingUp size={13} /> 7 days</span>
          </div>
          <div className="rev-chart">
            {weekly.map((day) => (
              <div className="rev-chart__col" key={day.date}>
                <span className="rev-chart__value">{day.revenue ? formatINR(day.revenue) : '—'}</span>
                <div className="rev-chart__track">
                  <div
                    className={`rev-chart__bar ${day.revenue === 0 ? 'is-empty' : ''}`}
                    style={{ height: `${Math.max(4, (day.revenue / maxRevenue) * 100)}%` }}
                  />
                </div>
                <span className="rev-chart__label">{day.label}</span>
                <small>{day.orders} order{day.orders === 1 ? '' : 's'}</small>
              </div>
            ))}
          </div>
        </section>

        <section className="admin-panel">
          <div className="admin-panel__head">
            <div>
              <h2>Inventory health</h2>
              <p>Live stock versus threshold.</p>
            </div>
            <span className={`admin-health ${stats.inventoryHealth < 80 ? 'is-warn' : ''}`}>{stats.inventoryHealth}%</span>
          </div>
          <div className="health-meter">
            <div style={{ width: `${stats.inventoryHealth}%` }} />
          </div>
          <div className="health-breakdown">
            <span><strong>{stats.lowStockCount}</strong> low-stock item(s)</span>
            <span><strong>{Object.values(statusCounts).reduce((sum, value) => sum + value, 0)}</strong> orders tracked</span>
          </div>
          <div className="low-stock-mini">
            {lowStock.length === 0 ? (
              <p className="admin-empty-note">All ingredients are comfortably stocked.</p>
            ) : (
              lowStock.slice(0, 4).map((item) => (
                <div className="low-stock-mini__row" key={item.id}>
                  <span className="low-stock-mini__emoji" style={{ background: `${item.color}33` }}>{item.emoji}</span>
                  <div>
                    <strong>{item.name}</strong>
                    <small>{item.stock} left · threshold {item.lowStockThreshold}</small>
                  </div>
                  <Link to="/admin/inventory" aria-label={`Manage ${item.name}`}><ArrowUpRight size={15} /></Link>
                </div>
              ))
            )}
            <Link to="/admin/inventory" className="link-arrow">Manage inventory <ArrowRight size={14} /></Link>
          </div>
        </section>
      </div>

      <div className="admin-dash-grid admin-dash-grid--even">
        <section className="admin-panel">
          <div className="admin-panel__head">
            <div>
              <h2>Recent orders</h2>
              <p>The latest tickets through the pass.</p>
            </div>
            <Link to="/admin/orders" className="link-arrow">All orders <ArrowRight size={14} /></Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="admin-empty-note">No orders yet. The oven is ready.</p>
          ) : (
            <div className="admin-recent">
              {recentOrders.map((order) => (
                <Link to={`/admin/orders?search=${order.orderNumber}`} className="admin-recent__row" key={order.id}>
                  <span className="admin-recent__icon"><ChefHat size={15} /></span>
                  <div>
                    <strong>{order.orderNumber}</strong>
                    <small>{order.customer?.name || 'Guest'} · {timeAgo(order.createdAt)}</small>
                  </div>
                  <StatusBadge status={order.status} />
                  <span className="admin-recent__total">{formatINR(order.total)}</span>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="admin-panel">
          <div className="admin-panel__head">
            <div>
              <h2>Top pizzas</h2>
              <p>Ranked by paid quantity.</p>
            </div>
            <span className="admin-panel__badge"><Boxes size={13} /> Menu</span>
          </div>
          {topPizzas.length === 0 ? (
            <p className="admin-empty-note">No paid orders yet, so the leaderboard is wide open.</p>
          ) : (
            <div className="top-pizzas">
              {topPizzas.map((pizza, index) => (
                <div className="top-pizzas__row" key={pizza.name}>
                  <span className="top-pizzas__rank">{String(index + 1).padStart(2, '0')}</span>
                  <div>
                    <div className="top-pizzas__label"><strong>{pizza.name}</strong><span>{pizza.quantity} sold</span></div>
                    <div className="top-pizzas__track"><div style={{ width: `${(pizza.quantity / maxTop) * 100}%` }} /></div>
                  </div>
                  <span className="top-pizzas__revenue">{formatINR(pizza.revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
