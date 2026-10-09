import { Router } from 'express';
import {
  getOverview,
  getTrends,
  getProductPerformance,
  getReturnAnalytics,
  getExpenseAnalytics,
} from '../controllers/analyticsController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/overview', getOverview);
router.get('/trends', getTrends);
router.get('/products', getProductPerformance);
router.get('/returns', getReturnAnalytics);
router.get('/expenses', getExpenseAnalytics);

export default router;
