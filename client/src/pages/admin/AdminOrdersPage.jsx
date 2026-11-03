import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ChefHat,
  CircleDollarSign,
  ClipboardList,
  Clock3,
  Loader2,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  Truck,
  User,
  X,
} from 'lucide-react';
import api from '../../lib/api';
import { formatDate, formatINR, shortAddress, timeAgo } from '../../lib/format';
import { useSocket } from '../../contexts/SocketContext';
import { useToast } from '../../contexts/ToastContext';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';

const filters = [
  { id: 'all', label: 'All orders' },
  { id: 'active', label: 'Active' },
  { id: 'payment_pending', label: 'Payment pending' },
  { id: 'received', label: 'Received' },
  { id: 'in_kitchen', label: 'In kitchen' },
  { id: 'out_for_delivery', label: 'Out for delivery' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'cancelled', label: 'Cancelled' },
];

const actionLabel = {
  received: 'Mark received',
  in_kitchen: 'Send to kitchen',
  out_for_delivery: 'Out for delivery',
  delivered: 'Mark delivered',
  cancelled: 'Cancel order',
};

const paymentLabel = (order) => {
  if (order.payment.provider === 'cod') {
    return order.payment.status === 'paid' ? 'COD · collected' : 'COD · on delivery';
  }
  return order.payment.status === 'paid' ? 'Paid' : 'Payment pending';
};

function AdminOrderModal({ orderId, onClose, onUpdated }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [updating, setUpdating] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api(`/admin/orders/${orderId}`)
      .then((data) => {
        if (!cancelled) setOrder(data.order);
      })
      .catch((caught) => {
        if (!cancelled) setError(caught.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const move = async (status) => {
    if (status === 'cancelled' && !window.confirm('Cancel this order? Paid stock will be restored.')) return;
    setUpdating(status);
    try {
      const data = await api(`/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        body: { status, note: note.trim() },
      });
      setOrder(data.order);
      setNote('');
      toast(data.message, { tone: 'success', title: 'Status updated' });
      onUpdated?.();
    } catch (caught) {
      toast(caught.message, { tone: 'error' });
    } finally {
      setUpdating('');
    }
  };

  return (
    <Modal open={Boolean(orderId)} onClose={onClose} title="Order control" subtitle={order ? `${order.orderNumber} · ${order.customer?.name || 'Guest'}` : 'Loading ticket'} wide>
      {loading ? (
        <div className="admin-modal-loading"><Loader2 size={24} className="spin" /> Loading ticket…</div>
      ) : error ? (
        <div className="admin-modal-loading"><AlertTriangle size={24} /> {error}</div>
      ) : order ? (
        <div className="admin-order-modal">
          <div className="admin-order-modal__top">
            <div>
              <StatusBadge status={order.status} label={order.statusLabel} />
              <h3>{formatINR(order.pricing.total)}</h3>
              <p>{formatDate(order.createdAt)} · {order.items.reduce((sum, item) => sum + item.quantity, 0)} item(s)</p>
            </div>
            <div className="admin-order-modal__customer">
              <span><User size={14} /> {order.customer?.name || 'Guest'}</span>
              <span><Phone size={14} /> {order.customer?.phone || order.deliveryAddress.phone}</span>
              <span><MapPin size={14} /> {shortAddress(order.deliveryAddress)}</span>
            </div>
          </div>

          <div className="admin-order-modal__grid">
            <div>
              <h4>Items</h4>
              <div className="admin-order-items">
                {order.items.map((item) => (
                  <div className="admin-order-item" key={item.id}>
                    <img src={item.image} alt="" />
                    <div>
                      <strong>{item.name} × {item.quantity}</strong>
                      <small>{item.sizeLabel} · {item.description}</small>
                    </div>
                    <span>{formatINR(item.lineTotal)}</span>
                  </div>
                ))}
              </div>
              <div className="admin-order-totals">
                <span>Subtotal <strong>{formatINR(order.pricing.subtotal)}</strong></span>
                {order.pricing.discount > 0 ? (
                  <span className="is-discount">Coupon {order.pricing.couponCode} <strong>-{formatINR(order.pricing.discount)}</strong></span>
                ) : null}
                <span>Tax <strong>{formatINR(order.pricing.tax)}</strong></span>
                <span>Delivery <strong>{order.pricing.deliveryFee === 0 ? 'Free' : formatINR(order.pricing.deliveryFee)}</strong></span>
                <span className="is-total">Total <strong>{formatINR(order.pricing.total)}</strong></span>
              </div>
            </div>
            <div>
              <h4>Payment</h4>
              <div className="admin-pay-card">
                <CircleDollarSign size={20} />
                <div>
                  <strong>{order.payment.provider === 'cod' && order.payment.status !== 'paid' ? 'Collect on delivery' : order.payment.status === 'paid' ? 'Paid' : 'Pending'}</strong>
                  <small>{order.payment.provider === 'cod' ? 'Cash on delivery (demo)' : order.payment.provider === 'razorpay' ? 'Razorpay' : 'Demo checkout'} · {formatINR(order.payment.amount)}</small>
                  {order.payment.paidAt ? <small>{formatDate(order.payment.paidAt)}</small> : null}
                </div>
              </div>

              <h4>Timeline</h4>
              <div className="admin-timeline">
                {[...order.timeline].reverse().slice(0, 5).map((event) => (
                  <div key={`${event.status}-${event.at}`}>
                    <span /><div><strong>{event.label}</strong><small>{timeAgo(event.at)}</small></div>
                  </div>
                ))}
                {!order.timeline.length ? <p className="admin-empty-note">No status events yet.</p> : null}
              </div>
            </div>
          </div>

          <div className="admin-order-modal__actions">
            <label className="field">
              <span>Status note <small>optional, shows in customer timeline</small></span>
              <input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Rider assigned, extra basil added…" maxLength={240} />
            </label>
            <div className="admin-order-modal__buttons">
              {order.allowedStatuses?.length ? order.allowedStatuses.map((status) => (
                <button
                  key={status}
                  className={`btn ${status === 'cancelled' ? 'btn--danger' : 'btn--sm'}`}
                  onClick={() => move(status)}
                  disabled={Boolean(updating)}
                >
                  {updating === status ? <Loader2 size={14} className="spin" /> : status === 'out_for_delivery' ? <Truck size={14} /> : status === 'cancelled' ? <X size={14} /> : <ChefHat size={14} />}
                  {actionLabel[status] || status}
                </button>
              )) : <span className="admin-order-final">This order is final. No further updates.</span>}
            </div>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}

export default function AdminOrdersPage() {
  const [params] = useSearchParams();
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState(params.get('search') || '');
  const [debounced, setDebounced] = useState(search);
  const [page, setPage] = useState(1);
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const { socket } = useSocket();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const query = new URLSearchParams({ page: String(page), limit: '20' });
      if (status !== 'all') query.set('status', status);
      if (debounced.trim()) query.set('search', debounced.trim());
      const data = await api(`/admin/orders?${query.toString()}`);
      setOrders(data.orders);
      setPagination(data.pagination);
      setError('');
    } catch (caught) {
      if (!silent) setError(caught.message);
    } finally {
      setLoading(false);
    }
  }, [page, status, debounced]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!socket) return undefined;
    let timer;
    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(() => load(true), 900);
    };
    socket.on('order:new', schedule);
    socket.on('order:updated', schedule);
    return () => {
      clearTimeout(timer);
      socket.off('order:new', schedule);
      socket.off('order:updated', schedule);
    };
  }, [socket, load]);

  const paginationInfo = useMemo(() => pagination, [pagination]);

  return (
    <div className="admin-page">
      <div className="admin-page__head">
        <div>
          <p className="eyebrow">Order pass</p>
          <h1>Live <em>orders.</em></h1>
          <p>Every ticket, every status change, updated in realtime.</p>
        </div>
        <button className="btn btn--ghost" onClick={() => load()}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      <div className="admin-panel">
        <div className="admin-toolbar">
          <div className="admin-filter-tabs">
            {filters.map((entry) => (
              <button key={entry.id} className={status === entry.id ? 'is-active' : ''} onClick={() => { setStatus(entry.id); setPage(1); }}>
                {entry.label}
              </button>
            ))}
          </div>
          <label className="admin-search">
            <Search size={16} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search order, name, email" />
          </label>
        </div>

        {error ? (
          <div className="admin-empty-note admin-empty-note--error"><AlertTriangle size={16} /> {error}</div>
        ) : loading ? (
          <div className="admin-table-skeleton">
            {[0, 1, 2, 3, 4].map((key) => <div key={key} />)}
          </div>
        ) : orders.length === 0 ? (
          <div className="admin-empty admin-empty--tall">
            <ClipboardList size={26} />
            <h3>No orders match this view.</h3>
            <p>Try another status, or clear the search.</p>
          </div>
        ) : (
          <>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Placed</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} onClick={() => setSelected(order.id)}>
                      <td><strong>{order.orderNumber}</strong><small>{paymentLabel(order)}</small></td>
                      <td><strong>{order.customer?.name || 'Guest'}</strong><small>{order.customer?.email}</small></td>
                      <td>{order.items.reduce((sum, item) => sum + item.quantity, 0)} item(s)<small>{order.items.map((item) => item.name).join(', ').slice(0, 42)}</small></td>
                      <td><strong>{formatINR(order.pricing.total)}</strong></td>
                      <td><StatusBadge status={order.status} label={order.statusLabel} /></td>
                      <td>{timeAgo(order.createdAt)}<small>{formatDate(order.createdAt)}</small></td>
                      <td><button className="admin-row-open" aria-label={`Open ${order.orderNumber}`}><ArrowRight size={15} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {paginationInfo && paginationInfo.pages > 1 ? (
              <div className="admin-pagination">
                <span>Page {paginationInfo.page} of {paginationInfo.pages} · {paginationInfo.total} orders</span>
                <div>
                  <button className="icon-btn" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}><ArrowLeft size={15} /></button>
                  <button className="icon-btn" disabled={page >= paginationInfo.pages} onClick={() => setPage((value) => value + 1)}><ArrowRight size={15} /></button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>

      {selected ? (
        <AdminOrderModal
          orderId={selected}
          onClose={() => setSelected(null)}
          onUpdated={() => load(true)}
        />
      ) : null}
    </div>
  );
}
