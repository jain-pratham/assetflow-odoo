import { Router } from 'express';
import { ActivityLogController } from '../controllers/activity.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { UserRole } from '../models/User';

const router = Router();

router.use(protect);
router.use(authorize(UserRole.ADMIN));

router.get('/', ActivityLogController.getLogs);

export default router;
