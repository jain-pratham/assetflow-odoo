import { Request, Response } from 'express';
import { Notification } from '../models/Notification';
import { NotificationPreference } from '../models/NotificationPreference';
import { successResponse, errorResponse } from '../utils/apiResponse';
import { UserRole } from '../models/User';

export class NotificationController {

  static getNotifications = async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const skip = (page - 1) * limit;

      const query: any = { recipient: req.user!._id };
      
      if (req.query.type) query.type = req.query.type;
      if (req.query.priority) query.priority = req.query.priority;
      if (req.query.isRead !== undefined) query.isRead = req.query.isRead === 'true';

      const total = await Notification.countDocuments(query);
      const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      return res.status(200).json(successResponse('Notifications retrieved', notifications, {
        total, page, pages: Math.ceil(total / limit) || 1
      }));
    } catch (error) {
      return res.status(500).json(errorResponse('Failed to fetch notifications'));
    }
  };

  static getUnreadCount = async (req: Request, res: Response) => {
    try {
      const count = await Notification.countDocuments({ recipient: req.user!._id, isRead: false });
      return res.status(200).json(successResponse('Unread count retrieved', { count }));
    } catch (error) {
      return res.status(500).json(errorResponse('Failed to fetch unread count'));
    }
  };

  static getLatest = async (req: Request, res: Response) => {
    try {
      const notifications = await Notification.find({ recipient: req.user!._id })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();
      return res.status(200).json(successResponse('Latest notifications retrieved', notifications));
    } catch (error) {
      return res.status(500).json(errorResponse('Failed to fetch latest notifications'));
    }
  };

  static markAsRead = async (req: Request, res: Response) => {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: req.params.id, recipient: req.user!._id },
        { isRead: true, readAt: new Date() },
        { new: true }
      );
      if (!notification) return res.status(404).json(errorResponse('Notification not found'));
      return res.status(200).json(successResponse('Notification marked as read', notification));
    } catch (error) {
      return res.status(500).json(errorResponse('Failed to mark notification as read'));
    }
  };

  static markAllAsRead = async (req: Request, res: Response) => {
    try {
      await Notification.updateMany(
        { recipient: req.user!._id, isRead: false },
        { isRead: true, readAt: new Date() }
      );
      return res.status(200).json(successResponse('All notifications marked as read', null));
    } catch (error) {
      return res.status(500).json(errorResponse('Failed to mark all as read'));
    }
  };

  static deleteNotification = async (req: Request, res: Response) => {
    try {
      const deleted = await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user!._id });
      if (!deleted) return res.status(404).json(errorResponse('Notification not found'));
      return res.status(200).json(successResponse('Notification deleted', null));
    } catch (error) {
      return res.status(500).json(errorResponse('Failed to delete notification'));
    }
  };

  static bulkDelete = async (req: Request, res: Response) => {
    try {
      const { ids } = req.body;
      if (!ids || !Array.isArray(ids)) return res.status(400).json(errorResponse('Invalid payload'));
      await Notification.deleteMany({ _id: { $in: ids }, recipient: req.user!._id });
      return res.status(200).json(successResponse('Notifications deleted', null));
    } catch (error) {
      return res.status(500).json(errorResponse('Failed to bulk delete notifications'));
    }
  };

  // Preferences
  static getPreferences = async (req: Request, res: Response) => {
    try {
      let prefs = await NotificationPreference.findOne({ user: req.user!._id });
      if (!prefs) {
        prefs = await NotificationPreference.create({ user: req.user!._id });
      }
      return res.status(200).json(successResponse('Preferences retrieved', prefs));
    } catch (error) {
      return res.status(500).json(errorResponse('Failed to fetch preferences'));
    }
  };

  static updatePreferences = async (req: Request, res: Response) => {
    try {
      const prefs = await NotificationPreference.findOneAndUpdate(
        { user: req.user!._id },
        { $set: req.body },
        { new: true, upsert: true }
      );
      return res.status(200).json(successResponse('Preferences updated', prefs));
    } catch (error) {
      return res.status(500).json(errorResponse('Failed to update preferences'));
    }
  };
}
