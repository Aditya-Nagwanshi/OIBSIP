import { Router } from 'express';
import { createIntent, confirmMock, verifyRazorpay } from '../controllers/paymentController.js';
import { authenticate, requireVerified } from '../middleware/auth.js';
import { orderLimiter } from '../middleware/rateLimits.js';

const router = Router();

router.use(authenticate, requireVerified);
router.post('/create', orderLimiter, createIntent);
router.post('/mock/confirm', orderLimiter, confirmMock);
router.post('/razorpay/verify', orderLimiter, verifyRazorpay);

export default router;
