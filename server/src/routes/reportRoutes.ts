import { Router } from 'express';
import { exportOrdersCsv, exportProfitabilityCsv } from '../controllers/reportController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.get('/orders.csv', exportOrdersCsv);
router.get('/profitability.csv', exportProfitabilityCsv);

export default router;
