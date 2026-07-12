import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { UserRole } from '../models/User';

const router = Router();

// Protect all category routes and restrict them to ADMIN only
router.use(protect);
router.use(authorize(UserRole.ADMIN));

router.get('/', CategoryController.getCategories);
router.get('/:id', CategoryController.getCategoryById);
router.post('/', CategoryController.createCategory);
router.put('/:id', CategoryController.updateCategory);
router.patch('/:id/status', CategoryController.toggleCategoryStatus);

export default router;
