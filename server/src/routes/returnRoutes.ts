import { Router } from 'express';
import {
  listReturns,
  getReturn,
  updateReturn,
} from '../controllers/returnController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { updateReturnSchema } from '../validators/schemas.js';

const router = Router();

router.use(requireAuth);

router.get('/', listReturns);
router.get('/:id', getReturn);
router.patch('/:id', validate(updateReturnSchema), updateReturn);

export default router;
