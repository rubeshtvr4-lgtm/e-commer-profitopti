import { Router } from 'express';
import {
  listShipments,
  createShipment,
  getShipment,
  updateShipment,
} from '../controllers/shipmentController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createShipmentSchema, updateShipmentSchema } from '../validators/schemas.js';

const router = Router();

router.use(requireAuth);

router.get('/', listShipments);
router.post('/', validate(createShipmentSchema), createShipment);
router.get('/:id', getShipment);
router.patch('/:id', validate(updateShipmentSchema), updateShipment);

export default router;
