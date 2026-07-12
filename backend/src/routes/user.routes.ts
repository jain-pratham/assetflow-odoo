import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { UserRole } from '../models/User';

const router = Router();

// Protect all user routes
router.use(protect);

router.get('/', UserController.getUsers);
router.get('/:id', UserController.getUserById);

router.use(authorize(UserRole.ADMIN));
router.put('/:id', UserController.updateUser);
router.patch('/:id/status', UserController.updateUserStatus);

export default router;
