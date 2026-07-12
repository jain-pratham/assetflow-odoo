import { Router } from 'express';
import { DepartmentController } from '../controllers/department.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { UserRole } from '../models/User';

const router = Router();

router.use(protect);

// Anyone logged in can get departments (for dropdowns)
router.get('/', DepartmentController.getDepartments);

export default router;
