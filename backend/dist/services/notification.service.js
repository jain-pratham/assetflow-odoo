"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const Notification_1 = require("../models/Notification");
const NotificationPreference_1 = require("../models/NotificationPreference");
const ActivityLog_1 = require("../models/ActivityLog");
const User_1 = require("../models/User");
const socket_service_1 = require("./socket.service");
const mail_service_1 = require("./mail.service");
class NotificationService {
    /**
     * Core notification logic.
     * 1. Check user preferences.
     * 2. Insert into DB.
     * 3. Emit via Socket.io.
     * 4. Send Email if applicable.
     */
    static async createNotification(params) {
        try {
            // Find recipient
            const user = await User_1.User.findById(params.recipient);
            if (!user)
                return null;
            // Get preferences (or defaults)
            let prefs = await NotificationPreference_1.NotificationPreference.findOne({ user: params.recipient });
            if (!prefs) {
                prefs = await NotificationPreference_1.NotificationPreference.create({ user: params.recipient });
            }
            // 1. Create DB Record
            const notification = await Notification_1.Notification.create({
                ...params,
                priority: params.priority || 'LOW',
            });
            // 2. Emit Socket Event (if browser/in-app enabled)
            if (prefs.enableBrowser || prefs.inApp !== false) {
                socket_service_1.SocketService.emitToUser(params.recipient, 'new_notification', notification);
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
                mail_service_1.MailService.sendEmail(user.email, subject, html).then(async (sent) => {
                    if (sent) {
                        notification.emailSent = true;
                        notification.emailSentAt = new Date();
                        await notification.save();
                    }
                });
            }
            return notification;
        }
        catch (error) {
            console.error('NotificationService Error:', error);
            return null;
        }
    }
    /**
     * Helper to write to the separate Activity Log.
     */
    static async logActivity(params) {
        try {
            return await ActivityLog_1.ActivityLog.create(params);
        }
        catch (error) {
            console.error('ActivityLog Error:', error);
            return null;
        }
    }
}
exports.NotificationService = NotificationService;
