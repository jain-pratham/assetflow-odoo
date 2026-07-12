import { Router } from 'express';
import { AuditController } from '../controllers/audit.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { UserRole } from '../models/User';

const router = Router();

router.use(protect);

// READ — all roles (controller enforces scoping)
router.get('/stats', AuditController.getStats);
router.get('/history', AuditController.getHistory);
router.get('/discrepancies', AuditController.getDiscrepancies);
router.get('/:id', AuditController.getById);
router.get('/', AuditController.getAudits);

// WRITE — ADMIN, ASSET_MANAGER, DEPARTMENT_HEAD
router.use(authorize(UserRole.ADMIN, UserRole.ASSET_MANAGER, UserRole.DEPARTMENT_HEAD));
router.post('/', AuditController.createAudit);
router.put('/:id/start', AuditController.startAudit);
router.put('/:id/verify', AuditController.verifyAsset);

// COMPLETE — ADMIN and ASSET_MANAGER only
router.put('/:id/complete',
  authorize(UserRole.ADMIN, UserRole.ASSET_MANAGER),
  AuditController.completeAudit
);

export default router;
