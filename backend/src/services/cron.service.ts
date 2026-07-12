import cron from 'node-cron';
import Asset from '../models/Asset';
import Booking from '../models/Booking';
import Maintenance from '../models/Maintenance';
import Audit from '../models/Audit';
import { User, UserRole } from '../models/User';
import { NotificationService } from './notification.service';
import { addDays, isPast, startOfDay } from 'date-fns';

export class CronService {
  
  static init() {
    // 1. Every Hour: Booking Reminders
    cron.schedule('0 * * * *', async () => {
      try {
        const upcomingBookings = await Booking.find({
          status: 'APPROVED',
          bookingDate: {
            $gte: new Date(),
            $lte: addDays(new Date(), 1)
          }
        }).populate('employeeId resourceId');

        for (const booking of upcomingBookings) {
          await NotificationService.createNotification({
            title: 'Booking Reminder',
            message: `Your booking for ${((booking as any).resourceId).name} is coming up.`,
            type: 'BOOKING',
            priority: 'MEDIUM',
            recipient: (booking as any).employeeId._id,
            entityType: 'Booking',
            entityId: booking._id as unknown as string,
            actionUrl: '/booking',
          });
        }
      } catch (error) {
        console.error('Cron: Booking Reminder Error', error);
      }
    });

    // 2. Every Day at Midnight: Overdue Assets & Maintenance & Audits
    cron.schedule('0 0 * * *', async () => {
      try {
        const today = startOfDay(new Date());

        // Overdue Bookings (Ended in past but still APPROVED/IN_PROGRESS)
        const overdueBookings = await Booking.find({
          status: 'APPROVED',
          bookingDate: { $lt: today }
        });
        for (const booking of overdueBookings) {
          await NotificationService.createNotification({
            title: 'Booking Overdue',
            message: 'A booking has passed its end date and has not been marked as completed.',
            type: 'BOOKING',
            priority: 'HIGH',
            recipient: booking.employeeId as unknown as string,
            entityType: 'Booking',
            entityId: booking._id as unknown as string,
            actionUrl: '/booking',
          });
        }

        // Maintenance Due (Overdue)
        const overdueMaintenance = await Maintenance.find({
          status: { $in: ['PENDING', 'IN_PROGRESS'] },
          expectedCompletionDate: { $lt: today }
        }).populate('assignedTechnicianId');
        for (const maint of overdueMaintenance) {
          if (maint.assignedTechnicianId) {
            await NotificationService.createNotification({
              title: 'Maintenance Overdue',
              message: `A maintenance task assigned to you is overdue.`,
              type: 'MAINTENANCE',
              priority: 'HIGH',
              recipient: (maint as any).assignedTechnicianId._id,
              entityType: 'Maintenance',
              entityId: maint._id as unknown as string,
              actionUrl: '/maintenance',
            });
          }
        }

        // Audit Due
        const overdueAudits = await Audit.find({
          status: { $in: ['OPEN', 'IN_PROGRESS'] },
          endDate: { $lt: today }
        }).populate('assignedAuditor');
        for (const audit of overdueAudits) {
          await NotificationService.createNotification({
            title: 'Audit Overdue',
            message: `Audit ${audit.auditNumber} is past its deadline.`,
            type: 'AUDIT',
            priority: 'HIGH',
            recipient: (audit as any).assignedAuditor._id,
            entityType: 'Audit',
            entityId: audit._id as unknown as string,
            actionUrl: '/audit',
          });
        }
      } catch (error) {
        console.error('Cron: Daily Checks Error', error);
      }
    });

    // 3. Every Month (1st Day): Monthly Report Ready
    cron.schedule('0 0 1 * *', async () => {
      try {
        const admins = await User.find({ role: UserRole.ADMIN, status: 'ACTIVE' });
        for (const admin of admins) {
          await NotificationService.createNotification({
            title: 'Monthly Analytics Ready',
            message: 'Your monthly asset and usage report is ready to view.',
            type: 'REPORT',
            priority: 'LOW',
            recipient: admin._id as unknown as string,
            actionUrl: '/reports',
          });
        }
      } catch (error) {
        console.error('Cron: Monthly Report Error', error);
      }
    });

    console.log('CronService: Background jobs initialized.');
  }
}
