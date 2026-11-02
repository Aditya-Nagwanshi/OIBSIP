import crypto from 'node:crypto';
import Razorpay from 'razorpay';
import { env, razorpayEnabled } from '../config/env.js';
import { HttpError } from '../utils/httpError.js';

let client = null;
function getClient() {
  if (!razorpayEnabled) return null;
  if (!client) {
    client = new Razorpay({ key_id: env.razorpayKeyId, key_secret: env.razorpayKeySecret });
  }
  return client;
}

export function paymentMode() {
  return razorpayEnabled ? 'razorpay' : 'mock';
}

export async function createPaymentIntent(order) {
  if (!razorpayEnabled) {
    return {
      mode: 'mock',
      orderId: String(order._id),
      orderNumber: order.orderNumber,
      amount: order.pricing.total,
      currency: env.currency,
    };
  }

  const razorpay = getClient();
  const existing = order.payment.razorpayOrderId;
  let razorpayOrder;

  if (existing) {
    razorpayOrder = await razorpay.orders.fetch(existing).catch(() => null);
  }
  if (!razorpayOrder) {
    razorpayOrder = await razorpay.orders.create({
      amount: Math.round(order.pricing.total * 100),
      currency: env.currency,
      receipt: order.orderNumber,
      notes: { orderId: String(order._id) },
    });
    order.payment.razorpayOrderId = razorpayOrder.id;
    await order.save();
  }

  return {
    mode: 'razorpay',
    keyId: env.razorpayKeyId,
    orderId: String(order._id),
    orderNumber: order.orderNumber,
    amount: order.pricing.total,
    amountPaise: Math.round(order.pricing.total * 100),
    currency: env.currency,
    razorpayOrderId: razorpayOrder.id,
    prefill: {},
  };
}

export function verifyRazorpaySignature({ razorpayOrderId, razorpayPaymentId, signature }) {
  if (!env.razorpayKeySecret) return false;
  const expected = crypto
    .createHmac('sha256', env.razorpayKeySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');
  const received = String(signature || '');
  if (expected.length !== received.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received));
}

export function assertRazorpayReady() {
  if (!razorpayEnabled) {
    throw new HttpError(
      503,
      'Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET, or use demo checkout.',
      undefined,
      'RAZORPAY_NOT_CONFIGURED'
    );
  }
}
