import { Notification, NotificationType, NotificationPriority } from '../models/Notification';
import { NotificationPreference } from '../models/NotificationPreference';
import { ActivityLog } from '../models/ActivityLog';
import { User } from '../models/User';
import { SocketService } from './socket.service';
import { MailService } from './mail.service';

interface CreateNotificationParams {
  title: string;
  message: string;
  type: NotificationType;
  priority?: NotificationPriority;
  recipient: string;
  sender?: string;
  entityType?: string;
  entityId?: string;
  actionUrl?: string;
  metadata?: any;
}

export class NotificationService {
  /**
   * Core notification logic.
   * 1. Check user preferences.
   * 2. Insert into DB.
   * 3. Emit via Socket.io.
   * 4. Send Email if applicable.
   */
  static async createNotification(params: CreateNotificationParams) {
    try {
      // Find recipient
      const user = await User.findById(params.recipient);
      if (!user) return null;

      // Get preferences (or defaults)
      let prefs = await NotificationPreference.findOne({ user: params.recipient });
      if (!prefs) {
        prefs = await NotificationPreference.create({ user: params.recipient });
      }

      // 1. Create DB Record
      const notification = await Notification.create({
        ...params,
        priority: params.priority || 'LOW',
      });

      // 2. Emit Socket Event (if browser/in-app enabled)
      if (prefs.enableBrowser) {
        SocketService.emitToUser(params.recipient, 'new_notification', notification);
      }

      // 3. Send Email (if enabled)
      if (prefs.enableEmail) {
        const subject = `[AssetFlow] ${params.title}`;
        const html = `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2>${params.title}</h2>
            <p>${params.message}</p>
            ${params.actionUrl ? `<a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}${params.actionUrl}" style="padding: 10px 15px; background: #3b82f6; color: #fff; text-decoration: none; border-radius: 5px;">View Details</a>` : ''}
          </div>
        `;
        
        // Don't await email so we don't block
        MailService.sendEmail(user.email, subject, html).then(async (sent) => {
          if (sent) {
            notification.emailSent = true;
            notification.emailSentAt = new Date();
            await notification.save();
          }
        });
      }

      return notification;
    } catch (error) {
      console.error('NotificationService Error:', error);
      return null;
    }
  }

  /**
   * Helper to write to the separate Activity Log.
   */
  static async logActivity(params: { actor: string; action: string; target?: string; entityType?: string; entityId?: string; ipAddress?: string; metadata?: any }) {
    try {
      return await ActivityLog.create(params);
    } catch (error) {
      console.error('ActivityLog Error:', error);
      return null;
    }
  }
}
