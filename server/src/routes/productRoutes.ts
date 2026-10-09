import { Router } from 'express';
import {
  listProducts,
  createProduct,
  getProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createProductSchema, updateProductSchema } from '../validators/schemas.js';

const router = Router();

router.use(requireAuth);

router.get('/', listProducts);
router.post('/', validate(createProductSchema), createProduct);
router.get('/:id', getProduct);
router.patch('/:id', validate(updateProductSchema), updateProduct);
router.delete('/:id', deleteProduct);

export default router;
