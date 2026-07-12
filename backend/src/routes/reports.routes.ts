import { Router } from 'express';
import { ReportsController } from '../controllers/reports.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);

router.get('/dashboard', ReportsController.getDashboard);
router.get('/charts', ReportsController.getCharts);
router.get('/assets', ReportsController.getAssetReport);
router.get('/bookings', ReportsController.getBookingReport);
router.get('/maintenance', ReportsController.getMaintenanceReport);
router.get('/audit', ReportsController.getAuditReport);

export default router;
