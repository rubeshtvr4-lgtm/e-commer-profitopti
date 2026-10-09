import { Router } from 'express';
import { getAiInsights } from '../controllers/aiController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.post('/insights', getAiInsights);

export default router;
