import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { updateProfileSchema } from '../validators/schemas.js';

const router = Router();

router.use(requireAuth);
router.get('/', getSettings);
router.patch('/', validate(updateProfileSchema), updateSettings);

export default router;
