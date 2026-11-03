import { z } from 'zod';
import { Order } from '../models/Order.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { parseBody } from '../middleware/validate.js';
import { createDraftOrder } from '../services/orderService.js';
import { createPaymentIntent } from '../services/razorpayService.js';
import { HttpError } from '../utils/httpError.js';

const addressSchema = z.object({
  line1: z.string().trim().min(4, 'Enter your street address.').max(160),
  line2: z.string().trim().max(160).optional().default(''),
  city: z.string().trim().min(2, 'Enter your city.').max(80),
  state: z.string().trim().min(2, 'Enter your state.').max(80),
  pincode: z.string().trim().regex(/^[1-9][0-9]{5}$/, 'Enter a 6-digit pincode.'),
  phone: z.string().trim().regex(/^[0-9+\-\s()]{8,20}$/, 'Enter a valid phone number.'),
  instructions: z.string().trim().max(300).optional().default(''),
});

const createOrderSchema = z.object({
  items: z.array(z.object({ kind: z.enum(['preset', 'custom']) }).passthrough()).min(1).max(12),
  deliveryAddress: addressSchema,
  paymentMethod: z.enum(['online', 'cod']).default('online'),
  couponCode: z.string().trim().max(24).optional().default(''),
});

export const createOrder = asyncHandler(async (req, res) => {
  const data = parseBody(createOrderSchema, req.body);
  const isCod = data.paymentMethod === 'cod';

  const order = await createDraftOrder({
    user: req.user,
    items: data.items,
    deliveryAddress: data.deliveryAddress,
    paymentMethod: data.paymentMethod,
    couponCode: data.couponCode,
  });

  if (isCod) {
    res.status(201).json({
      message: 'Order confirmed. Pay cash when your pizza arrives.',
      order: order.toPublic(),
      payment: null,
    });
    return;
  }

  const payment = await createPaymentIntent(order);

  res.status(201).json({
    message: 'Order summary ready. Complete payment to fire up the oven.',
    order: order.toPublic(),
    payment,
  });
});

export const listMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(60);
  res.json({ orders: orders.map((order) => order.toPublic()) });
});

export const getMyOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) throw new HttpError(404, 'Order not found.', undefined, 'ORDER_NOT_FOUND');
  res.json({ order: order.toPublic() });
});
