import { useEffect, useRef, useState } from 'react';
import { BadgeCheck, CheckCircle2, CreditCard, Loader2, Lock, ShieldCheck, Smartphone, XCircle } from 'lucide-react';
import Modal from '../ui/Modal';
import api from '../../lib/api';
import { formatINR } from '../../lib/format';

function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-razorpay]');
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => reject(new Error('Could not load Razorpay.')));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.dataset.razorpay = 'true';
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error('Could not load Razorpay. Check your connection.'));
    document.body.appendChild(script);
  });
}

export default function PaymentSheet({ open, payment, order, user, onPaid, onDismiss }) {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [method, setMethod] = useState('upi');
  const openedRazorpay = useRef(false);

  useEffect(() => {
    if (!open) {
      setStatus('idle');
      setError('');
      setMethod('upi');
      openedRazorpay.current = false;
      return;
    }
    if (payment?.mode !== 'razorpay' || openedRazorpay.current) return;
    openedRazorpay.current = true;

    loadRazorpay()
      .then(() => {
        const checkout = new window.Razorpay({
          key: payment.keyId,
          amount: payment.amountPaise,
          currency: payment.currency,
          name: 'Slice Theory',
          description: `Order ${payment.orderNumber}`,
          order_id: payment.razorpayOrderId,
          prefill: { name: user?.name || '', email: user?.email || '' },
          theme: { color: '#ff3d81' },
          handler: async (response) => {
            setStatus('processing');
            try {
              const data = await api('/payments/razorpay/verify', {
                method: 'POST',
                body: {
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                },
              });
              setStatus('paid');
              onPaid?.(data.order);
            } catch (caught) {
              setError(caught.message || 'We could not verify that payment.');
              setStatus('error');
            }
          },
          modal: {
            ondismiss: () => {
              onDismiss?.();
            },
          },
        });
        checkout.on('payment.failed', (response) => {
          setError(response?.error?.description || 'Payment failed. Please try again.');
          setStatus('error');
        });
        checkout.open();
      })
      .catch((caught) => {
        setError(caught.message);
        setStatus('error');
      });
  }, [open, payment, user, onPaid, onDismiss]);

  const payMock = async () => {
    setStatus('processing');
    setError('');
    try {
      const data = await api('/payments/mock/confirm', {
        method: 'POST',
        body: { orderId: payment.orderId },
      });
      setStatus('paid');
      onPaid?.(data.order);
    } catch (caught) {
      setError(caught.message || 'The demo payment could not be completed.');
      setStatus('error');
    }
  };

  if (payment?.mode === 'razorpay') {
    return (
      <Modal open={open} onClose={onDismiss} title="Razorpay checkout" subtitle={`Order ${order?.orderNumber || ''}`}>
        <div className="payment-state">
          {status === 'error' ? <XCircle size={34} /> : status === 'processing' || status === 'paid' ? <Loader2 size={34} className="spin" /> : <ShieldCheck size={34} />}
          <h3>{status === 'error' ? 'Payment hiccup' : 'Complete payment in the secure window'}</h3>
          <p>{error || 'Razorpay test-mode checkout has opened. Do not close this tab until it finishes.'}</p>
          <strong>{formatINR(payment.amount)}</strong>
          <button className="btn btn--ghost btn--block" onClick={onDismiss}>Close and pay later</button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open={open}
      onClose={onDismiss}
      title="Razorpay · Test mode"
      subtitle="Simulated Razorpay checkout. No real money moves."
      closeLabel="Cancel payment"
    >
      <div className="pay-sheet">
        <div className="pay-sheet__brand">
          <span className="pay-sheet__logo"><ShieldCheck size={18} /></span>
          <div>
            <strong>
              Razorpay <span className="pay-sheet__test">Test mode</span>
            </strong>
            <small>Slice Theory · Order {order?.orderNumber || payment?.orderNumber}</small>
          </div>
          <span className="pay-sheet__amount">{formatINR(payment?.amount || 0)}</span>
        </div>

        <div className="pay-sheet__testbar">
          <BadgeCheck size={15} />
          <span>Test credentials only. No card, UPI or bank account is charged.</span>
        </div>

        <div className="pay-sheet__methods" role="radiogroup" aria-label="Razorpay test payment method">
          <button
            className={method === 'upi' ? 'is-active' : ''}
            type="button"
            onClick={() => setMethod('upi')}
            role="radio"
            aria-checked={method === 'upi'}
          >
            <Smartphone size={16} /> UPI <small>Test</small>
          </button>
          <button
            className={method === 'card' ? 'is-active' : ''}
            type="button"
            onClick={() => setMethod('card')}
            role="radio"
            aria-checked={method === 'card'}
          >
            <CreditCard size={16} /> Card <small>Test</small>
          </button>
        </div>

        {method === 'upi' ? (
          <label className="pay-sheet__field">
            <span>Test UPI ID</span>
            <div>
              <input value="slice.theory@oktest" readOnly />
              <span className="pay-sheet__verified"><CheckCircle2 size={14} /> Verified</span>
            </div>
          </label>
        ) : (
          <div className="pay-sheet__testcard">
            <label className="pay-sheet__field">
              <span>Test card number</span>
              <div><input value="4242 4242 4242 4242" readOnly /></div>
            </label>
            <div className="pay-sheet__testcard-row">
              <label className="pay-sheet__field">
                <span>Expiry</span>
                <div><input value="12 / 34" readOnly /></div>
              </label>
              <label className="pay-sheet__field">
                <span>CVV</span>
                <div><input value="•••" readOnly /></div>
              </label>
            </div>
          </div>
        )}

        <div className="pay-sheet__note">
          <ShieldCheck size={16} />
          <p>
            Clicking <strong>Pay {formatINR(payment?.amount || 0)}</strong> runs a simulated Razorpay
            success callback, marks the order paid and sends your ticket to the kitchen.
          </p>
        </div>

        {error ? <p className="form-error">{error}</p> : null}

        <button className="btn btn--block btn--lg" onClick={payMock} disabled={status === 'processing' || status === 'paid'}>
          {status === 'processing' || status === 'paid' ? <Loader2 size={17} className="spin" /> : <Lock size={16} />}
          {status === 'processing'
            ? 'Confirming test payment…'
            : status === 'paid'
              ? 'Test payment confirmed'
              : `Pay ${formatINR(payment?.amount || 0)} · Test mode`}
        </button>
        <button className="btn btn--ghost btn--block" onClick={onDismiss} disabled={status === 'processing'}>
          Pay later
        </button>
        <p className="pay-sheet__fine">Razorpay test mode · No real charge · Stock is reserved after payment.</p>
      </div>
    </Modal>
  );
}
