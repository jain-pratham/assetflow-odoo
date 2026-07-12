import { Router } from 'express';
import { ProfileController } from '../controllers/profile.controller';
import { protect } from '../middleware/auth.middleware';
import { uploadAvatar } from '../middleware/upload.middleware';

const router = Router();

// Protect all profile routes
router.use(protect);

router.get('/', ProfileController.getProfile);
router.put('/', ProfileController.updateProfile);
router.patch('/password', ProfileController.updatePassword);

// Use multer upload middleware for the avatar
router.patch('/avatar', uploadAvatar.single('avatar'), ProfileController.updateAvatar);
router.delete('/avatar', ProfileController.removeAvatar);

router.get('/activity', ProfileController.getActivity);

export default router;
