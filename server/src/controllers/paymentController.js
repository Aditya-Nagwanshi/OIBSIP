import { z } from 'zod';
import { Order } from '../models/Order.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { parseBody } from '../middleware/validate.js';
import { HttpError } from '../utils/httpError.js';
import {
  assertRazorpayReady,
  createPaymentIntent,
  verifyRazorpaySignature,
} from '../services/razorpayService.js';
import { confirmOrderPayment } from '../services/orderService.js';

async function findOwnedOrder(orderId, userId) {
  const order = await Order.findOne({ _id: orderId, user: userId });
  if (!order) throw new HttpError(404, 'Order not found.', undefined, 'ORDER_NOT_FOUND');
  return order;
}

export const createIntent = asyncHandler(async (req, res) => {
  const { orderId } = parseBody(z.object({ orderId: z.string().min(10) }), req.body);
  const order = await findOwnedOrder(orderId, req.user._id);
  if (order.payment.status === 'paid') {
    throw new HttpError(409, 'This order is already paid.', undefined, 'ALREADY_PAID');
  }
  const payment = await createPaymentIntent(order);
  res.json({ payment, order: order.toPublic() });
});

export const confirmMock = asyncHandler(async (req, res) => {
  const { orderId } = parseBody(z.object({ orderId: z.string().min(10) }), req.body);
  const order = await findOwnedOrder(orderId, req.user._id);
  if (order.payment.provider === 'razorpay' && order.payment.razorpayOrderId) {
    throw new HttpError(400, 'This order was created for Razorpay checkout.', undefined, 'WRONG_PAYMENT_PROVIDER');
  }
  const confirmed = await confirmOrderPayment({
    orderId: order._id,
    userId: req.user._id,
    provider: 'mock',
    razorpayPaymentId: `pay_mock_${Date.now().toString(36)}`,
  });
  res.json({
    message: 'Payment simulated successfully. Your order is in the kitchen!',
    order: confirmed.toPublic(),
  });
});

const verifySchema = z.object({
  razorpayOrderId: z.string().min(5),
  razorpayPaymentId: z.string().min(5),
  razorpaySignature: z.string().min(10),
});

export const verifyRazorpay = asyncHandler(async (req, res) => {
  assertRazorpayReady();
  const data = parseBody(verifySchema, req.body);
  const order = await Order.findOne({
    'payment.razorpayOrderId': data.razorpayOrderId,
    user: req.user._id,
  });
  if (!order) throw new HttpError(404, 'Payment order not found.', undefined, 'ORDER_NOT_FOUND');

  const valid = verifyRazorpaySignature({
    razorpayOrderId: data.razorpayOrderId,
    razorpayPaymentId: data.razorpayPaymentId,
    signature: data.razorpaySignature,
  });
  if (!valid) {
    throw new HttpError(400, 'Payment signature verification failed.', undefined, 'INVALID_SIGNATURE');
  }

  const confirmed = await confirmOrderPayment({
    orderId: order._id,
    userId: req.user._id,
    provider: 'razorpay',
    razorpayPaymentId: data.razorpayPaymentId,
    razorpayOrderId: data.razorpayOrderId,
  });

  res.json({
    message: 'Payment verified. Your pizza is officially in the kitchen.',
    order: confirmed.toPublic(),
  });
});
