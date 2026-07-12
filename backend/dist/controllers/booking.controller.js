"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingController = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Booking_1 = __importDefault(require("../models/Booking"));
const BookingHistory_1 = __importDefault(require("../models/BookingHistory"));
const Asset_1 = __importDefault(require("../models/Asset"));
const booking_validator_1 = require("../validators/booking.validator");
const apiResponse_1 = require("../utils/apiResponse");
const User_1 = require("../models/User");
const notification_service_1 = require("../services/notification.service");
// Helper: convert "HH:MM" to total minutes from midnight
function timeToMinutes(time) {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
}
// Helper: check if two time ranges overlap
function timesOverlap(s1, e1, s2, e2) {
    const start1 = timeToMinutes(s1);
    const end1 = timeToMinutes(e1);
    const start2 = timeToMinutes(s2);
    const end2 = timeToMinutes(e2);
    return start1 < end2 && start2 < end1;
}
// Helper: RBAC filter for reading bookings
function getRbacQuery(user) {
    const role = user.role;
    if (role === User_1.UserRole.ADMIN || role === User_1.UserRole.ASSET_MANAGER)
        return {};
    if (role === User_1.UserRole.DEPARTMENT_HEAD)
        return { departmentId: user.departmentId };
    return { employeeId: user._id };
}
class BookingController {
    static getStats = async (req, res) => {
        try {
            const baseQuery = getRbacQuery(req.user);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const [totalResources, availableResources, todaysBookings, pendingRequests, approvedBookings, rejectedBookings,] = await Promise.all([
                Asset_1.default.countDocuments(),
                Asset_1.default.countDocuments({ status: 'AVAILABLE' }),
                Booking_1.default.countDocuments({ ...baseQuery, bookingDate: { $gte: today, $lt: tomorrow } }),
                Booking_1.default.countDocuments({ ...baseQuery, status: 'PENDING' }),
                Booking_1.default.countDocuments({ ...baseQuery, status: 'APPROVED' }),
                Booking_1.default.countDocuments({ ...baseQuery, status: 'REJECTED' }),
            ]);
            return res.status(200).json((0, apiResponse_1.successResponse)('Booking stats retrieved', {
                totalResources,
                availableResources,
                todaysBookings,
                pendingRequests,
                approvedBookings,
                rejectedBookings,
            }));
        }
        catch (error) {
            console.error('Get booking stats error:', error);
            return res.status(500).json((0, apiResponse_1.errorResponse)('Failed to fetch booking stats'));
        }
    };
    static getBookings = async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;
            const query = { ...getRbacQuery(req.user) };
            if (req.query.status)
                query.status = req.query.status;
            if (req.query.departmentId)
                query.departmentId = req.query.departmentId;
            if (req.query.categoryId)
                query.categoryId = req.query.categoryId;
            if (req.query.search) {
                query.$or = [
                    { purpose: { $regex: req.query.search, $options: 'i' } },
                ];
            }
            if (req.query.dateFrom || req.query.dateTo) {
                query.bookingDate = {};
                if (req.query.dateFrom)
                    query.bookingDate.$gte = new Date(req.query.dateFrom);
                if (req.query.dateTo) {
                    const to = new Date(req.query.dateTo);
                    to.setHours(23, 59, 59, 999);
                    query.bookingDate.$lte = to;
                }
            }
            const total = await Booking_1.default.countDocuments(query);
            const bookings = await Booking_1.default.find(query)
                .populate('resourceId', 'name tag')
                .populate('categoryId', 'name code')
                .populate('employeeId', 'firstName lastName email')
                .populate('departmentId', 'name')
                .populate('approvedBy', 'firstName lastName')
                .sort({ bookingDate: -1, startTime: -1 })
                .skip(skip)
                .limit(limit)
                .lean();
            return res.status(200).json((0, apiResponse_1.successResponse)('Bookings retrieved', bookings, {
                total, page, pages: Math.ceil(total / limit) || 1,
            }));
        }
        catch (error) {
            return res.status(500).json((0, apiResponse_1.errorResponse)('Failed to fetch bookings'));
        }
    };
    static getHistory = async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;
            const query = {};
            // For EMPLOYEE, filter by their own bookings via bookingId lookup
            // For DEPT_HEAD, filter by their department
            // This is done via a join — use aggregation for role-scoped history
            const role = req.user.role;
            if (role === User_1.UserRole.EMPLOYEE) {
                // get all bookingIds for this employee
                const empBookings = await Booking_1.default.find({ employeeId: req.user._id }).select('_id').lean();
                query.bookingId = { $in: empBookings.map(b => b._id) };
            }
            else if (role === User_1.UserRole.DEPARTMENT_HEAD) {
                const deptBookings = await Booking_1.default.find({ departmentId: req.user.departmentId }).select('_id').lean();
                query.bookingId = { $in: deptBookings.map(b => b._id) };
            }
            const total = await BookingHistory_1.default.countDocuments(query);
            const history = await BookingHistory_1.default.find(query)
                .populate('bookingId', 'bookingDate startTime endTime purpose status')
                .populate('resourceId', 'name tag')
                .populate('performedBy', 'firstName lastName')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean();
            return res.status(200).json((0, apiResponse_1.successResponse)('Booking history retrieved', history, {
                total, page, pages: Math.ceil(total / limit) || 1,
            }));
        }
        catch (error) {
            return res.status(500).json((0, apiResponse_1.errorResponse)('Failed to fetch booking history'));
        }
    };
    static getCalendar = async (req, res) => {
        try {
            const query = { ...getRbacQuery(req.user) };
            // Optional date range filter
            if (req.query.dateFrom || req.query.dateTo) {
                query.bookingDate = {};
                if (req.query.dateFrom)
                    query.bookingDate.$gte = new Date(req.query.dateFrom);
                if (req.query.dateTo) {
                    const to = new Date(req.query.dateTo);
                    to.setHours(23, 59, 59, 999);
                    query.bookingDate.$lte = to;
                }
            }
            const bookings = await Booking_1.default.find(query)
                .populate('resourceId', 'name tag')
                .populate('employeeId', 'firstName lastName')
                .populate('departmentId', 'name')
                .sort({ bookingDate: 1, startTime: 1 })
                .lean();
            // Map to calendar event format
            const events = bookings.map((b) => ({
                id: b._id,
                title: `${b.resourceId?.name || 'Resource'} — ${b.employeeId?.firstName} ${b.employeeId?.lastName}`,
                date: b.bookingDate,
                startTime: b.startTime,
                endTime: b.endTime,
                status: b.status,
                purpose: b.purpose,
                resource: b.resourceId,
                employee: b.employeeId,
                department: b.departmentId,
            }));
            return res.status(200).json((0, apiResponse_1.successResponse)('Calendar events retrieved', events));
        }
        catch (error) {
            return res.status(500).json((0, apiResponse_1.errorResponse)('Failed to fetch calendar data'));
        }
    };
    static getById = async (req, res) => {
        try {
            const booking = await Booking_1.default.findById(req.params.id)
                .populate('resourceId', 'name tag serialNumber')
                .populate('categoryId', 'name code')
                .populate('employeeId', 'firstName lastName email')
                .populate('departmentId', 'name')
                .populate('approvedBy', 'firstName lastName')
                .lean();
            if (!booking)
                return res.status(404).json((0, apiResponse_1.errorResponse)('Booking not found'));
            // RBAC: Employee can only view their own
            const role = req.user.role;
            if (role === User_1.UserRole.EMPLOYEE && booking.employeeId?._id?.toString() !== req.user._id.toString()) {
                return res.status(403).json((0, apiResponse_1.errorResponse)('Access denied'));
            }
            if (role === User_1.UserRole.DEPARTMENT_HEAD && booking.departmentId?._id?.toString() !== req.user.departmentId?.toString()) {
                return res.status(403).json((0, apiResponse_1.errorResponse)('Access denied'));
            }
            return res.status(200).json((0, apiResponse_1.successResponse)('Booking retrieved', booking));
        }
        catch (error) {
            return res.status(500).json((0, apiResponse_1.errorResponse)('Failed to fetch booking'));
        }
    };
    static createBooking = async (req, res) => {
        const session = await mongoose_1.default.startSession();
        session.startTransaction();
        try {
            const validatedData = booking_validator_1.createBookingSchema.parse(req.body);
            // RBAC: DEPT_HEAD can only book for their department
            if (req.user.role === User_1.UserRole.DEPARTMENT_HEAD && validatedData.departmentId !== req.user.departmentId?.toString()) {
                throw new Error('You can only book resources for your own department');
            }
            // Validate time logic
            const startMin = timeToMinutes(validatedData.startTime);
            const endMin = timeToMinutes(validatedData.endTime);
            if (endMin <= startMin)
                throw new Error('End time must be after start time');
            const duration = endMin - startMin;
            // Check resource exists and is available for booking
            const resource = await Asset_1.default.findById(validatedData.resourceId).session(session);
            if (!resource)
                throw new Error('Resource not found');
            // Check for overlapping APPROVED bookings on same date
            const bookingDate = new Date(validatedData.bookingDate);
            bookingDate.setHours(0, 0, 0, 0);
            const nextDay = new Date(bookingDate);
            nextDay.setDate(nextDay.getDate() + 1);
            const existingBookings = await Booking_1.default.find({
                resourceId: validatedData.resourceId,
                bookingDate: { $gte: bookingDate, $lt: nextDay },
                status: { $in: ['PENDING', 'APPROVED'] },
            }).session(session).lean();
            for (const eb of existingBookings) {
                if (timesOverlap(validatedData.startTime, validatedData.endTime, eb.startTime, eb.endTime)) {
                    throw new Error(`Resource is already booked from ${eb.startTime} to ${eb.endTime} on that date`);
                }
            }
            // Create booking
            const [booking] = await Booking_1.default.create([{
                    resourceId: validatedData.resourceId,
                    categoryId: validatedData.categoryId,
                    employeeId: validatedData.employeeId,
                    departmentId: validatedData.departmentId,
                    purpose: validatedData.purpose,
                    remarks: validatedData.remarks,
                    bookingDate: new Date(validatedData.bookingDate),
                    startTime: validatedData.startTime,
                    endTime: validatedData.endTime,
                    duration,
                    status: 'PENDING',
                }], { session });
            // Create history
            await BookingHistory_1.default.create([{
                    bookingId: booking._id,
                    resourceId: validatedData.resourceId,
                    action: 'CREATED',
                    performedBy: req.user._id,
                    remarks: validatedData.remarks,
                }], { session });
            await session.commitTransaction();
            const populated = await Booking_1.default.findById(booking._id)
                .populate('resourceId', 'name tag')
                .populate('categoryId', 'name')
                .populate('employeeId', 'firstName lastName')
                .populate('departmentId', 'name')
                .lean();
            // Notify Admins and Asset Managers
            const approvers = await User_1.User.find({ role: { $in: [User_1.UserRole.ADMIN, User_1.UserRole.ASSET_MANAGER] }, status: 'ACTIVE' });
            for (const approver of approvers) {
                await notification_service_1.NotificationService.createNotification({
                    title: 'New Booking Request',
                    message: `${populated.employeeId.firstName} requested to book ${populated.resourceId.name}.`,
                    type: 'BOOKING',
                    priority: 'MEDIUM',
                    recipient: approver._id,
                    entityType: 'Booking',
                    entityId: booking._id,
                    actionUrl: '/booking',
                });
            }
            await notification_service_1.NotificationService.logActivity({
                actor: req.user._id,
                action: 'REQUESTED_BOOKING',
                target: populated.resourceId.name,
                entityType: 'Booking',
                entityId: booking._id
            });
            return res.status(201).json((0, apiResponse_1.successResponse)('Booking request created successfully', populated));
        }
        catch (error) {
            await session.abortTransaction();
            if (error.name === 'ZodError') {
                const issues = error.errors || error.issues || [];
                return res.status(400).json((0, apiResponse_1.errorResponse)(issues[0]?.message || 'Validation failed'));
            }
            return res.status(400).json((0, apiResponse_1.errorResponse)(error.message || 'Failed to create booking'));
        }
        finally {
            session.endSession();
        }
    };
    static approveBooking = async (req, res) => {
        const session = await mongoose_1.default.startSession();
        session.startTransaction();
        try {
            const booking = await Booking_1.default.findById(req.params.id).session(session);
            if (!booking)
                throw new Error('Booking not found');
            if (booking.status !== 'PENDING')
                throw new Error('Only pending bookings can be approved');
            const validatedData = booking_validator_1.approveRejectBookingSchema.parse(req.body);
            booking.status = 'APPROVED';
            booking.approvedBy = new mongoose_1.default.Types.ObjectId(req.user._id.toString());
            booking.approvedAt = new Date();
            await booking.save({ session });
            await BookingHistory_1.default.create([{
                    bookingId: booking._id,
                    resourceId: booking.resourceId,
                    action: 'APPROVED',
                    performedBy: req.user._id,
                    remarks: validatedData.remarks,
                }], { session });
            await session.commitTransaction();
            await notification_service_1.NotificationService.createNotification({
                title: 'Booking Approved',
                message: `Your booking request has been approved.`,
                type: 'BOOKING',
                priority: 'HIGH',
                recipient: booking.employeeId.toString(),
                entityType: 'Booking',
                entityId: booking._id,
                actionUrl: '/booking',
            });
            await notification_service_1.NotificationService.logActivity({
                actor: req.user._id,
                action: 'APPROVED_BOOKING',
                entityType: 'Booking',
                entityId: booking._id
            });
            return res.status(200).json((0, apiResponse_1.successResponse)('Booking approved successfully', booking));
        }
        catch (error) {
            await session.abortTransaction();
            return res.status(400).json((0, apiResponse_1.errorResponse)(error.message || 'Failed to approve booking'));
        }
        finally {
            session.endSession();
        }
    };
    static rejectBooking = async (req, res) => {
        const session = await mongoose_1.default.startSession();
        session.startTransaction();
        try {
            const booking = await Booking_1.default.findById(req.params.id).session(session);
            if (!booking)
                throw new Error('Booking not found');
            if (booking.status !== 'PENDING')
                throw new Error('Only pending bookings can be rejected');
            const validatedData = booking_validator_1.approveRejectBookingSchema.parse(req.body);
            booking.status = 'REJECTED';
            await booking.save({ session });
            await BookingHistory_1.default.create([{
                    bookingId: booking._id,
                    resourceId: booking.resourceId,
                    action: 'REJECTED',
                    performedBy: req.user._id,
                    remarks: validatedData.remarks,
                }], { session });
            await session.commitTransaction();
            await notification_service_1.NotificationService.createNotification({
                title: 'Booking Rejected',
                message: `Your booking request was rejected. Reason: ${validatedData.remarks || 'None provided'}`,
                type: 'BOOKING',
                priority: 'HIGH',
                recipient: booking.employeeId.toString(),
                entityType: 'Booking',
                entityId: booking._id,
                actionUrl: '/booking',
            });
            await notification_service_1.NotificationService.logActivity({
                actor: req.user._id,
                action: 'REJECTED_BOOKING',
                entityType: 'Booking',
                entityId: booking._id
            });
            return res.status(200).json((0, apiResponse_1.successResponse)('Booking rejected', booking));
        }
        catch (error) {
            await session.abortTransaction();
            return res.status(400).json((0, apiResponse_1.errorResponse)(error.message || 'Failed to reject booking'));
        }
        finally {
            session.endSession();
        }
    };
    static cancelBooking = async (req, res) => {
        const session = await mongoose_1.default.startSession();
        session.startTransaction();
        try {
            const booking = await Booking_1.default.findById(req.params.id).session(session);
            if (!booking)
                throw new Error('Booking not found');
            if (booking.status !== 'PENDING' && booking.status !== 'APPROVED') {
                throw new Error('Only pending or approved bookings can be cancelled');
            }
            const validatedData = booking_validator_1.cancelBookingSchema.parse(req.body);
            // RBAC: Employee can only cancel their own pending bookings
            const role = req.user.role;
            if (role === User_1.UserRole.EMPLOYEE) {
                if (booking.employeeId.toString() !== req.user._id.toString()) {
                    throw new Error('You can only cancel your own bookings');
                }
                if (booking.status !== 'PENDING') {
                    throw new Error('Employees can only cancel pending bookings');
                }
            }
            if (role === User_1.UserRole.DEPARTMENT_HEAD) {
                if (booking.departmentId.toString() !== req.user.departmentId?.toString()) {
                    throw new Error('You can only cancel bookings from your department');
                }
            }
            booking.status = 'CANCELLED';
            await booking.save({ session });
            await BookingHistory_1.default.create([{
                    bookingId: booking._id,
                    resourceId: booking.resourceId,
                    action: 'CANCELLED',
                    performedBy: req.user._id,
                    remarks: validatedData.remarks,
                }], { session });
            await session.commitTransaction();
            // Only notify if someone else cancelled it
            if (booking.employeeId.toString() !== req.user._id.toString()) {
                await notification_service_1.NotificationService.createNotification({
                    title: 'Booking Cancelled',
                    message: `Your booking has been cancelled. Reason: ${validatedData.remarks || 'None provided'}`,
                    type: 'BOOKING',
                    priority: 'MEDIUM',
                    recipient: booking.employeeId.toString(),
                    entityType: 'Booking',
                    entityId: booking._id,
                    actionUrl: '/booking',
                });
            }
            await notification_service_1.NotificationService.logActivity({
                actor: req.user._id,
                action: 'CANCELLED_BOOKING',
                entityType: 'Booking',
                entityId: booking._id
            });
            return res.status(200).json((0, apiResponse_1.successResponse)('Booking cancelled', booking));
        }
        catch (error) {
            await session.abortTransaction();
            return res.status(400).json((0, apiResponse_1.errorResponse)(error.message || 'Failed to cancel booking'));
        }
        finally {
            session.endSession();
        }
    };
}
exports.BookingController = BookingController;
