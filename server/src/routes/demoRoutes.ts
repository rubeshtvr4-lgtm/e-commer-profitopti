import { Router, Response } from 'express';
import { DemoDataService } from '../services/demoDataService.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.post('/seed', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ownerId = req.ownerId!;
    const counts = await DemoDataService.seedDemoData(ownerId);
    res.json({
      success: true,
      message: 'Demo store data seeded successfully!',
      data: counts,
    });
  } catch (error: any) {
    console.error('Demo data seeding error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to seed demo data: ' + error.message,
    });
  }
});

export default router;
