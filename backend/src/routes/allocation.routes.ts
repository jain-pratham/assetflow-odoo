import { Router } from 'express';
import { AllocationController } from '../controllers/allocation.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { UserRole } from '../models/User';

const router = Router();

// Protect all routes
router.use(protect);

// Shared READ routes (ADMIN, ASSET_MANAGER, DEPARTMENT_HEAD, EMPLOYEE)
router.get('/', AllocationController.getAllocations);
router.get('/stats', AllocationController.getAllocationStats);
router.get('/history', AllocationController.getHistory);

// Restricted WRITE routes (ADMIN, ASSET_MANAGER, DEPARTMENT_HEAD)
// EMPLOYEE cannot allocate, transfer, or return.
router.use(authorize(UserRole.ADMIN, UserRole.ASSET_MANAGER, UserRole.DEPARTMENT_HEAD));
router.post('/', AllocationController.allocateAsset);
router.put('/:id/transfer', AllocationController.transferAsset);
router.put('/:id/return', AllocationController.returnAsset);

export default router;
