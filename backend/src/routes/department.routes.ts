import { Router } from 'express';
import { DepartmentController } from '../controllers/department.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { UserRole } from '../models/User';

const router = Router();

router.use(protect);

router.get('/', DepartmentController.getDepartments);
router.get('/:id', DepartmentController.getDepartmentById);

router.use(authorize(UserRole.ADMIN));
router.post('/', DepartmentController.createDepartment);
router.put('/:id', DepartmentController.updateDepartment);
router.patch('/:id/status', DepartmentController.toggleDepartmentStatus);

export default router;
