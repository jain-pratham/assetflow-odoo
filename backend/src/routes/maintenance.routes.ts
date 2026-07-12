import { Router } from 'express';
import { MaintenanceController } from '../controllers/maintenance.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { UserRole } from '../models/User';

const router = Router();

router.use(protect);

router.get('/stats', MaintenanceController.getStats);
router.get('/history', MaintenanceController.getHistory);
router.get('/calendar', MaintenanceController.getCalendar);
router.get('/:id', MaintenanceController.getById);
router.get('/', MaintenanceController.getMaintenance);

router.post('/', MaintenanceController.createMaintenance);

router.put(
  '/:id/assign',
  authorize(UserRole.ADMIN, UserRole.ASSET_MANAGER),
  MaintenanceController.assignTechnician
);

router.put(
  '/:id/status',
  authorize(UserRole.ADMIN, UserRole.ASSET_MANAGER, UserRole.TECHNICIAN),
  MaintenanceController.updateStatus
);

export default router;
