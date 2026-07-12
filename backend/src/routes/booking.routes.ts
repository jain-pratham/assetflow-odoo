import { Router } from 'express';
import { BookingController } from '../controllers/booking.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { UserRole } from '../models/User';

const router = Router();

// Protect all routes
router.use(protect);

// READ routes — all authenticated roles
router.get('/stats', BookingController.getStats);
router.get('/calendar', BookingController.getCalendar);
router.get('/history', BookingController.getHistory);
router.get('/:id', BookingController.getById);
router.get('/', BookingController.getBookings);

// CREATE — all roles can book
router.post('/', BookingController.createBooking);

// CANCEL — all roles (controller enforces own-only for EMPLOYEE)
router.put('/:id/cancel', BookingController.cancelBooking);

// APPROVE / REJECT — only ADMIN and ASSET_MANAGER
router.put('/:id/approve', authorize(UserRole.ADMIN, UserRole.ASSET_MANAGER), BookingController.approveBooking);
router.put('/:id/reject', authorize(UserRole.ADMIN, UserRole.ASSET_MANAGER), BookingController.rejectBooking);

export default router;
