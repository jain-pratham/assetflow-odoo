"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CronService = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const Booking_1 = __importDefault(require("../models/Booking"));
const Maintenance_1 = __importDefault(require("../models/Maintenance"));
const Audit_1 = __importDefault(require("../models/Audit"));
const User_1 = require("../models/User");
const notification_service_1 = require("./notification.service");
const date_fns_1 = require("date-fns");
class CronService {
    static init() {
        // 1. Every Hour: Booking Reminders
        node_cron_1.default.schedule('0 * * * *', async () => {
            try {
                const upcomingBookings = await Booking_1.default.find({
                    status: 'APPROVED',
                    bookingDate: {
                        $gte: new Date(),
                        $lte: (0, date_fns_1.addDays)(new Date(), 1)
                    }
                }).populate('employeeId resourceId');
                for (const booking of upcomingBookings) {
                    await notification_service_1.NotificationService.createNotification({
                        title: 'Booking Reminder',
                        message: `Your booking for ${(booking.resourceId).name} is coming up.`,
                        type: 'BOOKING',
                        priority: 'MEDIUM',
                        recipient: booking.employeeId._id,
                        entityType: 'Booking',
                        entityId: booking._id,
                        actionUrl: '/booking',
                    });
                }
            }
            catch (error) {
                console.error('Cron: Booking Reminder Error', error);
            }
        });
        // 2. Every Day at Midnight: Overdue Assets & Maintenance & Audits
        node_cron_1.default.schedule('0 0 * * *', async () => {
            try {
                const today = (0, date_fns_1.startOfDay)(new Date());
                // Overdue Bookings (Ended in past but still APPROVED/IN_PROGRESS)
                const overdueBookings = await Booking_1.default.find({
                    status: 'APPROVED',
                    bookingDate: { $lt: today }
                });
                for (const booking of overdueBookings) {
                    await notification_service_1.NotificationService.createNotification({
                        title: 'Booking Overdue',
                        message: 'A booking has passed its end date and has not been marked as completed.',
                        type: 'BOOKING',
                        priority: 'HIGH',
                        recipient: booking.employeeId,
                        entityType: 'Booking',
                        entityId: booking._id,
                        actionUrl: '/booking',
                    });
                }
                // Maintenance Due (Overdue)
                const overdueMaintenance = await Maintenance_1.default.find({
                    status: { $in: ['PENDING', 'IN_PROGRESS'] },
                    expectedCompletionDate: { $lt: today }
                }).populate('assignedTechnicianId');
                for (const maint of overdueMaintenance) {
                    if (maint.assignedTechnicianId) {
                        await notification_service_1.NotificationService.createNotification({
                            title: 'Maintenance Overdue',
                            message: `A maintenance task assigned to you is overdue.`,
                            type: 'MAINTENANCE',
                            priority: 'HIGH',
                            recipient: maint.assignedTechnicianId._id,
                            entityType: 'Maintenance',
                            entityId: maint._id,
                            actionUrl: '/maintenance',
                        });
                    }
                }
                // Audit Due
                const overdueAudits = await Audit_1.default.find({
                    status: { $in: ['OPEN', 'IN_PROGRESS'] },
                    endDate: { $lt: today }
                }).populate('assignedAuditor');
                for (const audit of overdueAudits) {
                    await notification_service_1.NotificationService.createNotification({
                        title: 'Audit Overdue',
                        message: `Audit ${audit.auditNumber} is past its deadline.`,
                        type: 'AUDIT',
                        priority: 'HIGH',
                        recipient: audit.assignedAuditor._id,
                        entityType: 'Audit',
                        entityId: audit._id,
                        actionUrl: '/audit',
                    });
                }
            }
            catch (error) {
                console.error('Cron: Daily Checks Error', error);
            }
        });
        // 3. Every Month (1st Day): Monthly Report Ready
        node_cron_1.default.schedule('0 0 1 * *', async () => {
            try {
                const admins = await User_1.User.find({ role: User_1.UserRole.ADMIN, status: 'ACTIVE' });
                for (const admin of admins) {
                    await notification_service_1.NotificationService.createNotification({
                        title: 'Monthly Analytics Ready',
                        message: 'Your monthly asset and usage report is ready to view.',
                        type: 'REPORT',
                        priority: 'LOW',
                        recipient: admin._id,
                        actionUrl: '/reports',
                    });
                }
            }
            catch (error) {
                console.error('Cron: Monthly Report Error', error);
            }
        });
        console.log('CronService: Background jobs initialized.');
    }
}
exports.CronService = CronService;
