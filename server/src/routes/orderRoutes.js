import { Router } from 'express';
import { createOrder, listMyOrders, getMyOrder } from '../controllers/orderController.js';
import { authenticate, requireVerified } from '../middleware/auth.js';
import { orderLimiter } from '../middleware/rateLimits.js';

const router = Router();

router.use(authenticate, requireVerified);
router.post('/', orderLimiter, createOrder);
router.get('/', listMyOrders);
router.get('/:id', getMyOrder);

export default router;
