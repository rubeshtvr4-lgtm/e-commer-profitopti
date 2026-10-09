import { Router } from 'express';
import authRoutes from './authRoutes.js';
import productRoutes from './productRoutes.js';
import orderRoutes from './orderRoutes.js';
import returnRoutes from './returnRoutes.js';
import shipmentRoutes from './shipmentRoutes.js';
import expenseRoutes from './expenseRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';
import aiRoutes from './aiRoutes.js';
import reportRoutes from './reportRoutes.js';
import settingsRoutes from './settingsRoutes.js';
import demoRoutes from './demoRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/returns', returnRoutes);
router.use('/shipments', shipmentRoutes);
router.use('/expenses', expenseRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/ai', aiRoutes);
router.use('/reports', reportRoutes);
router.use('/settings', settingsRoutes);
router.use('/demo', demoRoutes);

export default router;
