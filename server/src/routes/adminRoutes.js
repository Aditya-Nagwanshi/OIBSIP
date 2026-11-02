import { Router } from 'express';
import {
  getStats,
  listInventory,
  updateInventoryItem,
  createInventoryItem,
  listOrders,
  getOrder,
  changeOrderStatus,
  listStockAlerts,
  triggerLowStockCheck,
} from '../controllers/adminController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { apiLimiter } from '../middleware/rateLimits.js';

const router = Router();

router.use(apiLimiter, authenticate, requireAdmin);

router.get('/stats', getStats);
router.get('/inventory', listInventory);
router.post('/inventory', createInventoryItem);
router.patch('/inventory/:id', updateInventoryItem);
router.get('/orders', listOrders);
router.get('/orders/:id', getOrder);
router.patch('/orders/:id/status', changeOrderStatus);
router.get('/alerts', listStockAlerts);
router.post('/alerts/check', triggerLowStockCheck);

export default router;
