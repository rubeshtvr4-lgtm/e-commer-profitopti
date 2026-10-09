import { Router } from 'express';
import {
  listOrders,
  createOrder,
  getOrder,
  updateOrder,
  updateOrderStatus,
  createOrderReturn,
} from '../controllers/orderController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createOrderSchema,
  updateOrderSchema,
  updateOrderStatusSchema,
  createReturnSchema,
} from '../validators/schemas.js';

const router = Router();

router.use(requireAuth);

router.get('/', listOrders);
router.post('/', validate(createOrderSchema), createOrder);
router.get('/:id', getOrder);
router.patch('/:id', validate(updateOrderSchema), updateOrder);
router.patch('/:id/status', validate(updateOrderStatusSchema), updateOrderStatus);
router.post('/:id/returns', createOrderReturn);

export default router;
