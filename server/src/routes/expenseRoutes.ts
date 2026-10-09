import { Router } from 'express';
import {
  listExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} from '../controllers/expenseController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createExpenseSchema, updateExpenseSchema } from '../validators/schemas.js';

const router = Router();

router.use(requireAuth);

router.get('/', listExpenses);
router.post('/', validate(createExpenseSchema), createExpense);
router.patch('/:id', validate(updateExpenseSchema), updateExpense);
router.delete('/:id', deleteExpense);

export default router;
