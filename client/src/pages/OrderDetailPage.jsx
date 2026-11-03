import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  ChefHat,
  Clock3,
  CreditCard,
  Flame,
  Loader2,
  MapPin,
  PackageCheck,
  Phone,
  ReceiptText,
  RefreshCw,
  Truck,
  XCircle,
} from 'lucide-react';
import api from '../lib/api';
import { formatDate, formatINR, minutesUntil, orderProgress, shortAddress, timeAgo } from '../lib/format';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { useToast } from '../contexts/ToastContext';
import usePageTitle from '../hooks/usePageTitle';
import PageLoader from '../components/ui/PageLoader';
import StatusBadge from '../components/ui/StatusBadge';
import PaymentSheet from '../components/checkout/PaymentSheet';

const TRACK_STEPS = [
  { key: 'received', label: 'Order received', copy: 'Ticket printed, oven queued.', icon: ReceiptText },
  { key: 'in_kitchen', label: 'In the kitchen', copy: 'Dough stretched, oven at 450°C.', icon: ChefHat },
  { key: 'out_for_delivery', label: 'Out for delivery', copy: 'Box sealed, rider on the move.', icon: Truck },
  { key: 'delivered', label: 'Delivered', copy: 'The theory has been tested.', icon: PackageCheck },
];

const CONFETTI = Array.from({ length: 26 }, (_, index) => ({
  left: `${(index * 41) % 100}%`,
  delay: `${(index % 7) * 0.24}s`,
  duration: `${2.6 + (index % 5) * 0.4}s`,
  color: ['#E7334A', '#FFC93C', '#4E8D3A', '#FFB6C8', '#341A43'][index % 5],
  rotate: `${(index * 67) % 360}deg`,
}));

export default function OrderDetailPage() {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const celebrate = params.get('celebrate') === '1';
  const { user } = useAuth();
  const { socket, connected } = useSocket();
  const { toast } = useToast();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payment, setPayment] = useState(null);
  const [payError, setPayError] = useState('');
  const [preparingPay, setPreparingPay] = useState(false);
  const [showCelebration, setShowCelebration] = useState(celebrate);
  const lastStatus = useRef('');

  usePageTitle(order ? `Order ${order.orderNumber}` : 'Track order');

  const fetchOrder = useCallback(async (silent = false) => {
    try {
      const data = await api(`/orders/${id}`);
      if (silent && lastStatus.current && lastStatus.current !== data.order.status) {
        toast(`Order update: ${data.order.statusLabel}.`, { tone: 'info', title: 'The kitchen checked in' });
      }
      lastStatus.current = data.order.status;
      setOrder(data.order);
      setError('');
    } catch (caught) {
      if (!silent) setError(caught.message || 'Could not load this order.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  useEffect(() => {
    if (!socket) return undefined;
    const handler = ({ order: updated }) => {
      if (!updated || updated.id !== id) return;
      if (lastStatus.current && lastStatus.current !== updated.status) {
        toast(`Order update: ${updated.statusLabel}.`, { tone: 'info', title: 'Live from the kitchen' });
      }
      lastStatus.current = updated.status;
      setOrder(updated);
    };
    socket.on('order:updated', handler);
    socket.on('order:created', handler);
    return () => {
      socket.off('order:updated', handler);
      socket.off('order:created', handler);
    };
  }, [socket, id, toast]);

  useEffect(() => {
    if (!order) return undefined;
    if (['delivered', 'cancelled'].includes(order.status)) return undefined;
    const interval = setInterval(() => fetchOrder(true), 30000);
    return () => clearInterval(interval);
  }, [order?.status, fetchOrder]);

  useEffect(() => {
    if (!celebrate) return undefined;
    const timer = setTimeout(() => {
      setShowCelebration(false);
      const nextParams = new URLSearchParams(params);
      nextParams.delete('celebrate');
      setParams(nextParams, { replace: true });
    }, 6500);
    return () => clearTimeout(timer);
  }, [celebrate]);

  const progress = orderProgress(order?.status);
  const isPending = order?.status === 'payment_pending';
  const isCancelled = order?.status === 'cancelled';
  const eta = order ? minutesUntil(order.estimatedDeliveryAt) : 0;

  const timeline = useMemo(() => {
    if (!order?.timeline?.length) return [];
    return [...order.timeline].sort((a, b) => new Date(b.at) - new Date(a.at));
  }, [order?.timeline]);

  const startPayment = async () => {
    setPreparingPay(true);
    setPayError('');
    try {
      const data = await api('/payments/create', { method: 'POST', body: { orderId: order.id } });
      setOrder(data.order);
      setPayment(data.payment);
    } catch (caught) {
      setPayError(caught.message || 'Could not open the payment window.');
    } finally {
      setPreparingPay(false);
    }
  };

  const onPaid = (paidOrder) => {
    setPayment(null);
    setOrder(paidOrder);
    toast('Payment confirmed. Your order is in the kitchen.', { tone: 'success' });
  };

  if (loading) return <PageLoader label="Looking up your order" />;

  if (error || !order) {
    return (
      <section className="section">
        <div className="container empty-state empty-state--centered">
          <span className="empty-state__icon"><AlertCircle size={28} /></span>
          <h1>We lost that ticket.</h1>
          <p>{error || 'This order does not exist, or it belongs to another account.'}</p>
          <div className="empty-state__actions">
            <Link className="btn" to="/dashboard">Back to my orders</Link>
            <Link className="btn btn--ghost" to="/menu">Order something new</Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <AnimatePresence>
        {showCelebration ? (
          <motion.div className="celebration" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="confetti" aria-hidden="true">
              {CONFETTI.map((piece, index) => (
                <span
                  key={index}
                  style={{
                    left: piece.left,
                    animationDelay: piece.delay,
                    animationDuration: piece.duration,
                    background: piece.color,
                    transform: `rotate(${piece.rotate})`,
                  }}
                />
              ))}
            </div>
            <motion.div
              className="celebration__card"
              initial={{ y: 30, scale: 0.9, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 240, damping: 20 }}
            >
              <span className="celebration__icon">
                {order?.payment?.provider === 'cod' ? <Truck size={24} /> : <Flame size={24} />}
              </span>
              <h2>{order?.payment?.provider === 'cod' ? 'Order placed.' : 'Payment confirmed.'}</h2>
              <p>
                {order?.payment?.provider === 'cod'
                  ? 'Cash on delivery locked in. Have the exact change ready — the kitchen has your ticket.'
                  : 'The kitchen has your ticket. Your pizza is officially in the queue.'}
              </p>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <section className={`order-page ${isPending ? 'order-page--pending' : ''}`}>
        <div className="container">
          <Link to="/dashboard" className="back-link"><ArrowLeft size={15} /> All orders</Link>

          <div className="order-page__head">
            <div>
              <div className="order-page__title-row">
                <h1>Order <em>{order.orderNumber}</em></h1>
                <StatusBadge status={order.status} label={order.statusLabel} />
              </div>
              <p>
                Placed {formatDate(order.createdAt)} · {order.items.reduce((sum, item) => sum + item.quantity, 0)} item(s) ·{' '}
                {formatINR(order.pricing.total)}
              </p>
            </div>
            <div className="order-page__live">
              <span className={`live-dot ${connected ? 'is-on' : ''}`} />
              {connected ? 'Live updates on' : 'Polling for updates'}
            </div>
          </div>

          {isPending ? (
            <div className="pay-now-banner">
              <span className="pay-now-banner__icon"><CreditCard size={22} /></span>
              <div>
                <h2>Payment pending.</h2>
                <p>Your order is saved but the oven is waiting. Complete payment within 30 minutes to fire it up.</p>
                {payError ? <p className="form-error">{payError}</p> : null}
              </div>
              <button className="btn btn--lg" onClick={startPayment} disabled={preparingPay}>
                {preparingPay ? <Loader2 size={17} className="spin" /> : <CreditCard size={17} />}
                {preparingPay ? 'Opening…' : 'Complete payment'}
              </button>
            </div>
          ) : isCancelled ? (
            <div className="cancelled-banner">
              <XCircle size={24} />
              <div>
                <h2>This order was cancelled.</h2>
                <p>No pizza today. Any reserved ingredients have been returned to the kitchen.</p>
              </div>
              <Link to="/menu" className="btn btn--ghost">Start a new theory</Link>
            </div>
          ) : (
            <div className="tracker">
              <div className="tracker__head">
                <div>
                  <h2>
                    {order.status === 'delivered' ? 'Delivered. Theory proven.' : 'Your pizza is on its way to becoming.'}
                  </h2>
                  <p>
                    {order.status === 'delivered'
                      ? `Delivered ${timeAgo(order.updatedAt)}. We hope it was worth the wait.`
                      : eta > 0
                        ? `Estimated arrival in about ${eta} minutes.`
                        : `Latest update ${timeAgo(order.updatedAt)}.`}
                  </p>
                </div>
                {order.status !== 'delivered' ? (
                  <span className="tracker__eta"><Clock3 size={15} /> {eta > 0 ? `${eta} min` : 'Any minute now'}</span>
                ) : (
                  <span className="tracker__eta tracker__eta--done"><BadgeCheck size={15} /> Delivered</span>
                )}
              </div>

              <div className="tracker__steps">
                {TRACK_STEPS.map((step, index) => {
                  const Icon = step.icon;
                  const done = index <= progress;
                  const active = index === progress && order.status !== 'delivered';
                  return (
                    <div className={`tracker-step ${done ? 'is-done' : ''} ${active ? 'is-active' : ''}`} key={step.key}>
                      <div className="tracker-step__top">
                        <span className="tracker-step__icon">{done ? <Check size={16} /> : <Icon size={16} />}</span>
                        <span className="tracker-step__line" />
                      </div>
                      <strong>{step.label}</strong>
                      <p>{step.copy}</p>
                      {active ? <span className="tracker-step__pulse">In progress</span> : null}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="order-page__grid">
            <div className="order-page__main">
              <section className="order-panel">
                <div className="order-panel__head">
                  <h2>Your items</h2>
                  <span>{order.items.length} line(s)</span>
                </div>
                <div className="receipt-items">
                  {order.items.map((item) => (
                    <div className="receipt-item" key={item.id}>
                      <div className="receipt-item__img"><img src={item.image} alt={item.name} loading="lazy" /></div>
                      <div className="receipt-item__copy">
                        <h3>{item.name} <small>× {item.quantity}</small></h3>
                        <p>{item.sizeLabel} · {item.description}</p>
                        {item.custom ? (
                          <div className="receipt-item__custom">
                            <span>Base: {item.custom.base?.name}</span>
                            <span>Sauce: {item.custom.sauce?.name}</span>
                            <span>Cheese: {item.custom.cheese?.name}</span>
                            {item.custom.vegetables?.length ? <span>Toppings: {item.custom.vegetables.map((veg) => veg.name).join(', ')}</span> : null}
                          </div>
                        ) : null}
                      </div>
                      <strong>{formatINR(item.lineTotal)}</strong>
                    </div>
                  ))}
                </div>
              </section>

              <section className="order-panel">
                <div className="order-panel__head">
                  <h2>Delivery address</h2>
                  <MapPin size={17} />
                </div>
                <p className="order-address">{shortAddress(order.deliveryAddress)}</p>
                <p className="order-address__phone"><Phone size={13} /> {order.deliveryAddress.phone}</p>
                {order.deliveryAddress.instructions ? (
                  <p className="order-address__note">“{order.deliveryAddress.instructions}”</p>
                ) : null}
              </section>

              {timeline.length ? (
                <section className="order-panel">
                  <div className="order-panel__head">
                    <h2>Kitchen timeline</h2>
                    <span>{timeline.length} update(s)</span>
                  </div>
                  <div className="order-timeline">
                    {timeline.map((event, index) => (
                      <div className={`order-timeline__event ${index === 0 ? 'is-latest' : ''}`} key={`${event.status}-${event.at}`}>
                        <span className="order-timeline__dot" />
                        <div>
                          <strong>{event.label}</strong>
                          {event.note ? <p>{event.note}</p> : null}
                          <small>{formatDate(event.at)}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>

            <aside className="order-page__aside">
              <div className="order-summary card-summary">
                <h2><ReceiptText size={17} /> Receipt</h2>
                <div className="cart-summary">
                  <div className="cart-summary__row"><span>Subtotal</span><span>{formatINR(order.pricing.subtotal)}</span></div>
                  {order.pricing.discount > 0 ? (
                    <div className="cart-summary__row cart-summary__row--discount">
                      <span>Coupon {order.pricing.couponCode}</span><span>-{formatINR(order.pricing.discount)}</span>
                    </div>
                  ) : null}
                  <div className="cart-summary__row"><span>Taxes</span><span>{formatINR(order.pricing.tax)}</span></div>
                  <div className="cart-summary__row"><span>Delivery</span><span>{order.pricing.deliveryFee === 0 ? 'Free' : formatINR(order.pricing.deliveryFee)}</span></div>
                  <div className="cart-summary__row cart-summary__row--total"><span>Total</span><span>{formatINR(order.pricing.total)}</span></div>
                </div>
                <div className="receipt-payment">
                  <span className={`receipt-payment__badge ${order.payment.status === 'paid' ? 'is-paid' : ''}`}>
                    {order.payment.status === 'paid' ? <Check size={13} /> : <Clock3 size={13} />}
                    {order.payment.status === 'paid' ? 'Paid' : 'Pending'}
                  </span>
                  <span>{order.payment.provider === 'razorpay' ? 'Razorpay' : order.payment.provider === 'cod' ? 'Cash on delivery' : 'Demo checkout'} · {formatINR(order.payment.amount)}</span>
                  {order.payment.paidAt ? <small>{formatDate(order.payment.paidAt)}</small> : null}
                </div>
                <button className="btn btn--ghost btn--block" onClick={() => fetchOrder()}><RefreshCw size={14} /> Refresh status</button>
              </div>

              <div className="order-help">
                <span className="order-help__emoji">🍕</span>
                <h3>Something not right?</h3>
                <p>If the tracker stalls or the cheese pull was compromised, our kitchen team will make it right.</p>
                <a className="link-arrow" href={`mailto:hello@slicetheory.pizza?subject=Order ${order.orderNumber}`}>
                  Contact the kitchen <ArrowRight size={14} />
                </a>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {payment ? (
        <PaymentSheet
          open={Boolean(payment)}
          payment={payment}
          order={order}
          user={user}
          onPaid={onPaid}
          onDismiss={() => setPayment(null)}
        />
      ) : null}
    </>
  );
}
