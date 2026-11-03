import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, BadgeCheck, Banknote, CreditCard, Loader2, Lock, MapPin, Minus, Plus, ShieldCheck, ShoppingBag, TicketPercent, Trash2, Truck, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useConfig } from '../contexts/ConfigContext';
import { useToast } from '../contexts/ToastContext';
import usePageTitle from '../hooks/usePageTitle';
import { formatINR } from '../lib/format';
import { ADDRESS_KEY } from '../lib/constants';
import api from '../lib/api';
import PaymentSheet from '../components/checkout/PaymentSheet';

const emptyAddress = {
  line1: '',
  line2: '',
  city: '',
  state: '',
  pincode: '',
  phone: '',
  instructions: '',
};

const round = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

function readAddress() {
  try {
    const raw = localStorage.getItem(ADDRESS_KEY);
    return raw ? { ...emptyAddress, ...JSON.parse(raw) } : emptyAddress;
  } catch {
    return emptyAddress;
  }
}

export default function CheckoutPage() {
  usePageTitle('Checkout');
  const { user } = useAuth();
  const { items, totals, updateQuantity, removeItem, clearCart, orderItems } = useCart();
  const { config } = useConfig();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [address, setAddress] = useState(readAddress);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState(null);
  const [payment, setPayment] = useState(null);
  const [payMethod, setPayMethod] = useState('online');
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');

  useEffect(() => {
    localStorage.setItem(ADDRESS_KEY, JSON.stringify(address));
  }, [address]);

  useEffect(() => {
    if (user?.phone && !address.phone) setAddress((current) => ({ ...current, phone: user.phone }));
  }, [user?.phone]);

  const deliveryIsFree = totals.delivery === 0;
  const payMode = config?.payments?.mode === 'razorpay' ? 'Razorpay test checkout' : 'Demo checkout';
  const availableCoupons = config?.coupons?.length
    ? config.coupons
    : [{ code: 'INFOBYTE', percent: 40, label: 'InfoByte special — 40% off' }];
  const discount = coupon ? round(totals.subtotal * (coupon.percent / 100)) : 0;
  const taxableSubtotal = round(totals.subtotal - discount);
  const tax = round(taxableSubtotal * (config?.taxRate ?? 0.05));
  const finalTotal = round(taxableSubtotal + tax + totals.delivery);

  const applyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    const match = availableCoupons.find((entry) => entry.code.toUpperCase() === code);
    if (!code) {
      setCouponError('Type the code first. The pizza cannot read your mind.');
      return;
    }
    if (!match) {
      setCouponError(`That code is not in the lab. Try INFOBYTE for 40% off.`);
      return;
    }
    setCoupon(match);
    setCouponError('');
    setCouponInput(match.code);
    toast(`${match.percent}% off applied. The maths department approves.`, { tone: 'success', title: match.code });
  };

  const removeCoupon = () => {
    setCoupon(null);
    setCouponInput('');
    setCouponError('');
  };

  const filled = useMemo(
    () => ['line1', 'city', 'state', 'pincode', 'phone'].every((field) => String(address[field] || '').trim()),
    [address]
  );

  const update = (field) => (event) => {
    setAddress((current) => ({ ...current, [field]: event.target.value }));
    setError('');
  };

  const placeOrder = async (event) => {
    event.preventDefault();
    if (!items.length) return;
    if (!filled) {
      setError('Fill in the delivery details so the kitchen knows where to send the happiness.');
      return;
    }
    if (!/^[1-9][0-9]{5}$/.test(address.pincode.trim())) {
      setError('Enter a valid 6-digit pincode.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const data = await api('/orders', {
        method: 'POST',
        body: {
          items: orderItems,
          deliveryAddress: address,
          paymentMethod: payMethod === 'cod' ? 'cod' : 'online',
          couponCode: coupon?.code || '',
        },
      });
      if (payMethod === 'cod') {
        clearCart();
        toast('Order placed. Keep the cash ready for the delivery hero.', {
          tone: 'success',
          title: 'Cash on delivery',
        });
        navigate(`/orders/${data.order.id}?celebrate=1`);
        return;
      }
      setOrder(data.order);
      setPayment(data.payment);
      clearCart();
    } catch (caught) {
      if (caught.status === 403) {
        setError('Please verify your email before placing an order.');
      } else {
        setError(caught.message || 'We could not create your order. Try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const onPaid = (paidOrder) => {
    setPayment(null);
    toast('Payment confirmed. The kitchen has your ticket.', { tone: 'success', title: 'Order fired up' });
    navigate(`/orders/${paidOrder.id}?celebrate=1`);
  };

  const onDismiss = () => {
    setPayment(null);
    if (order) {
      toast('Your order is saved. Complete payment from the order page.', { tone: 'info' });
      navigate(`/orders/${order.id}`);
    }
  };

  if (!items.length && !order) {
    return (
      <section className="section checkout-empty">
        <div className="container empty-state empty-state--centered">
          <div className="cart-empty__emoji">🛒</div>
          <h1>Your bag is empty.</h1>
          <p>Hard to checkout a theory that doesn&apos;t exist yet. Pick a pizza or build one from scratch.</p>
          <div className="empty-state__actions">
            <Link className="btn" to="/menu">Browse the menu <ArrowRight size={16} /></Link>
            <Link className="btn btn--ghost" to="/build">Open the builder</Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="checkout">
        <div className="container">
          <div className="checkout__head">
            <div>
              <p className="eyebrow">Almost in the oven</p>
              <h1>Checkout</h1>
            </div>
            <div className="checkout__steps">
              <span className="is-done">Bag</span>
              <span className="is-active">Details &amp; payment</span>
              <span>Track</span>
            </div>
          </div>

          {!user?.isVerified ? (
            <div className="notice notice--warning">
              <AlertCircle size={18} />
              <div>
                <strong>Verify your email first.</strong>
                <p>We sent a verification link when you signed up. You can resend it from your dashboard.</p>
              </div>
              <Link className="btn btn--sm" to="/dashboard">Open dashboard</Link>
            </div>
          ) : null}

          <form className="checkout__grid" onSubmit={placeOrder}>
            <div className="checkout__main">
              <section className="checkout-panel">
                <div className="checkout-panel__head">
                  <span className="checkout-panel__icon"><MapPin size={18} /></span>
                  <div>
                    <h2>Where should we send it?</h2>
                    <p>We deliver across the city. Live tracking starts once the kitchen fires up.</p>
                  </div>
                </div>
                <div className="form-grid">
                  <label className="field field--full">
                    <span>Street address</span>
                    <input value={address.line1} onChange={update('line1')} placeholder="Flat 4B, 12 Basil Lane" autoComplete="address-line1" required />
                  </label>
                  <label className="field field--full">
                    <span>Apartment, floor, landmark <small>optional</small></span>
                    <input value={address.line2} onChange={update('line2')} placeholder="Near the old stone oven" autoComplete="address-line2" />
                  </label>
                  <label className="field">
                    <span>City</span>
                    <input value={address.city} onChange={update('city')} placeholder="Mumbai" autoComplete="address-level2" required />
                  </label>
                  <label className="field">
                    <span>State</span>
                    <input value={address.state} onChange={update('state')} placeholder="Maharashtra" autoComplete="address-level1" required />
                  </label>
                  <label className="field">
                    <span>Pincode</span>
                    <input value={address.pincode} onChange={update('pincode')} placeholder="400001" inputMode="numeric" maxLength={6} autoComplete="postal-code" required />
                  </label>
                  <label className="field">
                    <span>Phone number</span>
                    <input value={address.phone} onChange={update('phone')} placeholder="+91 98765 43210" autoComplete="tel" required />
                  </label>
                  <label className="field field--full">
                    <span>Delivery instructions <small>optional</small></span>
                    <textarea value={address.instructions} onChange={update('instructions')} rows={2} placeholder="Ring the bell twice, the doorbell is shy." maxLength={300} />
                  </label>
                </div>
              </section>

              <section className="checkout-panel">
                <div className="checkout-panel__head">
                  <span className="checkout-panel__icon"><ShoppingBag size={18} /></span>
                  <div>
                    <h2>Your order</h2>
                    <p>{items.reduce((sum, item) => sum + item.quantity, 0)} item(s), freshly priced by the kitchen.</p>
                  </div>
                </div>
                <div className="checkout-items">
                  {items.map((item) => (
                    <div className="checkout-item" key={item.id}>
                      <div className="checkout-item__img"><img src={item.image} alt={item.name} loading="lazy" /></div>
                      <div className="checkout-item__body">
                        <div className="checkout-item__top">
                          <div>
                            <h3>{item.name}</h3>
                            <p>{item.sizeLabel} · {item.description}</p>
                          </div>
                          <strong>{formatINR(item.unitPrice * item.quantity)}</strong>
                        </div>
                        <div className="checkout-item__foot">
                          <div className="qty-control">
                            <button type="button" onClick={() => updateQuantity(item.id, -1)} aria-label="Decrease quantity"><Minus size={13} /></button>
                            <span>{item.quantity}</span>
                            <button type="button" onClick={() => updateQuantity(item.id, 1)} aria-label="Increase quantity"><Plus size={13} /></button>
                          </div>
                          <button type="button" className="cart-remove" onClick={() => removeItem(item.id)}>
                            <Trash2 size={12} /> Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="checkout-panel checkout-panel--secure">
                <div className="checkout-panel__head">
                  <span className="checkout-panel__icon"><Lock size={18} /></span>
                  <div>
                    <h2>Payment</h2>
                    <p>{payMethod === 'cod' ? 'Pay cash at your door. Demo order, no real money.' : `${payMode}. This demo never charges a real card.`}</p>
                  </div>
                  <span className="checkout-panel__pill"><ShieldCheck size={13} /> Secure</span>
                </div>
                <div className="checkout-pay-methods" role="radiogroup" aria-label="Payment method">
                  <label className={`pay-method ${payMethod === 'online' ? 'is-active' : ''}`}>
                    <input
                      type="radio"
                      name="pay-method"
                      value="online"
                      checked={payMethod === 'online'}
                      onChange={() => { setPayMethod('online'); setError(''); }}
                    />
                    <span className="pay-method__icon"><CreditCard size={18} /></span>
                    <span className="pay-method__body">
                      <strong>{config?.payments?.mode === 'razorpay' ? 'UPI / Cards via Razorpay' : 'Pay online · Demo UPI'}</strong>
                      <small>
                        {config?.payments?.mode === 'razorpay'
                          ? 'Open the secure Razorpay window and confirm instantly.'
                          : 'Simulated instant pay. Ingredient stock reserved right away.'}
                      </small>
                    </span>
                    <span className="pay-method__tick"><BadgeCheck size={17} /></span>
                  </label>
                  <label className={`pay-method pay-method--cod ${payMethod === 'cod' ? 'is-active' : ''}`}>
                    <input
                      type="radio"
                      name="pay-method"
                      value="cod"
                      checked={payMethod === 'cod'}
                      onChange={() => { setPayMethod('cod'); setError(''); }}
                    />
                    <span className="pay-method__icon"><Banknote size={18} /></span>
                    <span className="pay-method__body">
                      <strong>Cash on Delivery</strong>
                      <small>Pay {formatINR(finalTotal)} in cash when your slice arrives. Demo mode.</small>
                    </span>
                    <span className="pay-method__tick"><BadgeCheck size={17} /></span>
                  </label>
                </div>
                {payMethod === 'cod' ? (
                  <div className="checkout-cod-note">
                    <Truck size={16} />
                    <p>Order fires into the kitchen immediately. Our rider collects {formatINR(finalTotal)} on arrival.</p>
                  </div>
                ) : null}
              </section>
            </div>

            <aside className="checkout__summary">
              <div className="order-summary">
                <h2>Order summary</h2>

                <div className={`coupon-box ${coupon ? 'is-applied' : ''}`}>
                  <div className="coupon-box__head">
                    <TicketPercent size={15} />
                    <span>{coupon ? 'Coupon applied' : 'Have a coupon?'}</span>
                  </div>
                  {coupon ? (
                    <div className="coupon-box__applied">
                      <div>
                        <strong>{coupon.code}</strong>
                        <small>{coupon.percent}% off · {coupon.label}</small>
                      </div>
                      <button type="button" onClick={removeCoupon} aria-label="Remove coupon"><X size={14} /></button>
                    </div>
                  ) : (
                    <>
                      <div className="coupon-box__form">
                        <input
                          value={couponInput}
                          onChange={(event) => {
                            setCouponInput(event.target.value.toUpperCase());
                            setCouponError('');
                          }}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault();
                              applyCoupon();
                            }
                          }}
                          placeholder="INFOBYTE"
                          aria-label="Coupon code"
                        />
                        <button type="button" onClick={applyCoupon}>Apply</button>
                      </div>
                      {couponError ? <p className="coupon-box__error">{couponError}</p> : null}
                    </>
                  )}
                </div>

                <div className="cart-summary">
                  <div className="cart-summary__row">
                    <span>Subtotal</span><span>{formatINR(totals.subtotal)}</span>
                  </div>
                  {discount > 0 ? (
                    <div className="cart-summary__row cart-summary__row--discount">
                      <span>Coupon ({coupon.code})</span><span>-{formatINR(discount)}</span>
                    </div>
                  ) : null}
                  <div className="cart-summary__row">
                    <span>Taxes ({Math.round((config?.taxRate ?? 0.05) * 100)}%)</span><span>{formatINR(tax)}</span>
                  </div>
                  <div className="cart-summary__row">
                    <span>Delivery</span><span>{deliveryIsFree ? 'Free' : formatINR(totals.delivery)}</span>
                  </div>
                  {totals.amountToFreeDelivery > 0 ? (
                    <p className="order-summary__nudge">Add {formatINR(totals.amountToFreeDelivery)} more for free delivery (below {formatINR(totals.deliveryThreshold)}).</p>
                  ) : (
                    <p className="order-summary__nudge order-summary__nudge--free">Free delivery unlocked on orders over {formatINR(totals.deliveryThreshold)} 🎉</p>
                  )}
                  <div className="cart-summary__row cart-summary__row--total">
                    <span>Total</span><span>{formatINR(finalTotal)}</span>
                  </div>
                </div>

                {error ? <p className="form-error"><AlertCircle size={14} /> {error}</p> : null}

                <button className="btn btn--block btn--lg" type="submit" disabled={submitting || !items.length || !user?.isVerified}>
                  {submitting ? <Loader2 size={17} className="spin" /> : payMethod === 'cod' ? <Banknote size={16} /> : <Lock size={16} />}
                  {submitting
                    ? 'Creating your order…'
                    : payMethod === 'cod'
                      ? `Place COD order · ${formatINR(finalTotal)}`
                      : `Pay ${formatINR(finalTotal)}`}
                </button>
                <p className="order-summary__fine">
                  {payMethod === 'cod'
                    ? 'Demo cash on delivery: the order enters the kitchen right away and cash is collected at your door.'
                    : 'Placing the order creates a 30-minute payment window. Ingredients are reserved only after payment succeeds.'}
                </p>
                <div className="order-summary__trust">
                  <span><ShieldCheck size={13} /> Server-verified pricing</span>
                  <span><BadgeCheck size={13} /> Live order updates</span>
                </div>
                <Link to="/menu" className="link-arrow order-summary__back">Keep browsing <ArrowRight size={14} /></Link>
              </div>
            </aside>
          </form>
        </div>
      </section>

      {payment && order ? (
        <PaymentSheet
          open={Boolean(payment)}
          payment={payment}
          order={order}
          user={user}
          onPaid={onPaid}
          onDismiss={onDismiss}
        />
      ) : null}
    </>
  );
}
