import { Router } from 'express';
import { getStats, getCharts, getRecentData, globalSearch } from '../controllers/dashboard.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

// Dashboard is restricted to ADMIN and potentially other high-level roles.
// The user explicitly stated "This dashboard is ONLY for the COMPANY ADMIN."
router.use(protect);
router.use(authorize('ADMIN'));

router.get('/stats', getStats);
router.get('/charts', getCharts);
router.get('/recent', getRecentData);
router.get('/search', globalSearch);

export default router;
