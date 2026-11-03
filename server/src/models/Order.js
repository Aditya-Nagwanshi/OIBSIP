import mongoose from 'mongoose';

export const ORDER_STATUSES = ['payment_pending', 'received', 'in_kitchen', 'out_for_delivery', 'delivered', 'cancelled'];

export const STATUS_LABELS = {
  payment_pending: 'Awaiting Payment',
  received: 'Order Received',
  in_kitchen: 'In Kitchen',
  out_for_delivery: 'Sent to Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const recipeLineSchema = new mongoose.Schema(
  {
    inventoryItem: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem', required: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0.5 },
  },
  { _id: false }
);

const selectedOptionSchema = new mongoose.Schema(
  {
    id: { type: mongoose.Schema.Types.ObjectId },
    slug: { type: String },
    name: { type: String },
    price: { type: Number },
    category: { type: String },
  },
  { _id: false }
);

const orderItemSchema = new mongoose.Schema(
  {
    kind: { type: String, enum: ['preset', 'custom'], required: true },
    pizza: { type: mongoose.Schema.Types.ObjectId, ref: 'Pizza' },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    image: { type: String, default: '/media/pizzas/margherita.webp' },
    size: { type: String, enum: ['regular', 'medium', 'large'], default: 'medium' },
    sizeLabel: { type: String, default: 'Medium 11"' },
    quantity: { type: Number, required: true, min: 1, max: 10 },
    unitPrice: { type: Number, required: true, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 },
    custom: {
      base: { type: selectedOptionSchema },
      sauce: { type: selectedOptionSchema },
      cheese: { type: selectedOptionSchema },
      vegetables: { type: [selectedOptionSchema], default: [] },
    },
    recipe: { type: [recipeLineSchema], default: [] },
  },
  { _id: true }
);

const timelineSchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    label: { type: String, required: true },
    note: { type: String, default: '' },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: { type: [orderItemSchema], required: true },
    pricing: {
      subtotal: { type: Number, required: true },
      tax: { type: Number, required: true },
      deliveryFee: { type: Number, required: true },
      discount: { type: Number, default: 0 },
      couponCode: { type: String, default: '' },
      total: { type: Number, required: true },
    },
    deliveryAddress: {
      line1: { type: String, required: true },
      line2: { type: String, default: '' },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      phone: { type: String, required: true },
      instructions: { type: String, default: '', maxlength: 300 },
    },
    status: { type: String, enum: ORDER_STATUSES, default: 'payment_pending', index: true },
    payment: {
      provider: { type: String, enum: ['mock', 'razorpay', 'cod'], default: 'mock' },
      status: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending',
      },
      razorpayOrderId: { type: String, default: '' },
      razorpayPaymentId: { type: String, default: '' },
      cod: { type: Boolean, default: false },
      note: { type: String, default: '' },
      amount: { type: Number, required: true },
      currency: { type: String, default: 'INR' },
      paidAt: { type: Date },
      failureReason: { type: String, default: '' },
    },
    timeline: { type: [timelineSchema], default: [] },
    estimatedDeliveryAt: { type: Date },
    cancelReason: { type: String, default: '' },
    paymentExpiresAt: { type: Date },
  },
  { timestamps: true }
);

orderSchema.index({ createdAt: -1 });

orderSchema.methods.toPublic = function toPublic() {
  return {
    id: String(this._id),
    orderNumber: this.orderNumber,
    status: this.status,
    statusLabel: STATUS_LABELS[this.status],
    items: this.items.map((item) => ({
      id: String(item._id),
      kind: item.kind,
      name: item.name,
      description: item.description,
      image: item.image,
      size: item.size,
      sizeLabel: item.sizeLabel,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
      custom: item.kind === 'custom' ? item.custom : undefined,
    })),
    pricing: this.pricing,
    deliveryAddress: this.deliveryAddress,
    payment: {
      provider: this.payment.provider,
      status: this.payment.status,
      amount: this.payment.amount,
      currency: this.payment.currency,
      paidAt: this.payment.paidAt,
      razorpayOrderId: this.payment.razorpayOrderId,
    },
    timeline: this.timeline,
    estimatedDeliveryAt: this.estimatedDeliveryAt,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export const Order = mongoose.model('Order', orderSchema);
