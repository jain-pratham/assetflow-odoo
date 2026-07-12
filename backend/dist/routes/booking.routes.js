"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const booking_controller_1 = require("../controllers/booking.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const User_1 = require("../models/User");
const router = (0, express_1.Router)();
// Protect all routes
router.use(auth_middleware_1.protect);
// READ routes — all authenticated roles
router.get('/stats', booking_controller_1.BookingController.getStats);
router.get('/calendar', booking_controller_1.BookingController.getCalendar);
router.get('/history', booking_controller_1.BookingController.getHistory);
router.get('/:id', booking_controller_1.BookingController.getById);
router.get('/', booking_controller_1.BookingController.getBookings);
// CREATE — all roles can book
router.post('/', booking_controller_1.BookingController.createBooking);
// CANCEL — all roles (controller enforces own-only for EMPLOYEE)
router.put('/:id/cancel', booking_controller_1.BookingController.cancelBooking);
// APPROVE / REJECT — only ADMIN and ASSET_MANAGER
router.put('/:id/approve', (0, auth_middleware_1.authorize)(User_1.UserRole.ADMIN, User_1.UserRole.ASSET_MANAGER), booking_controller_1.BookingController.approveBooking);
router.put('/:id/reject', (0, auth_middleware_1.authorize)(User_1.UserRole.ADMIN, User_1.UserRole.ASSET_MANAGER), booking_controller_1.BookingController.rejectBooking);
exports.default = router;
