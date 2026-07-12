"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationController = void 0;
const Notification_1 = require("../models/Notification");
const NotificationPreference_1 = require("../models/NotificationPreference");
const apiResponse_1 = require("../utils/apiResponse");
class NotificationController {
    static getNotifications = async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50;
            const skip = (page - 1) * limit;
            const query = { recipient: req.user._id };
            if (req.query.type)
                query.type = req.query.type;
            if (req.query.priority)
                query.priority = req.query.priority;
            if (req.query.isRead !== undefined)
                query.isRead = req.query.isRead === 'true';
            const total = await Notification_1.Notification.countDocuments(query);
            const notifications = await Notification_1.Notification.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean();
            return res.status(200).json((0, apiResponse_1.successResponse)('Notifications retrieved', notifications, {
                total, page, pages: Math.ceil(total / limit) || 1
            }));
        }
        catch (error) {
            return res.status(500).json((0, apiResponse_1.errorResponse)('Failed to fetch notifications'));
        }
    };
    static getUnreadCount = async (req, res) => {
        try {
            const count = await Notification_1.Notification.countDocuments({ recipient: req.user._id, isRead: false });
            return res.status(200).json((0, apiResponse_1.successResponse)('Unread count retrieved', { count }));
        }
        catch (error) {
            return res.status(500).json((0, apiResponse_1.errorResponse)('Failed to fetch unread count'));
        }
    };
    static getLatest = async (req, res) => {
        try {
            const notifications = await Notification_1.Notification.find({ recipient: req.user._id })
                .sort({ createdAt: -1 })
                .limit(10)
                .lean();
            return res.status(200).json((0, apiResponse_1.successResponse)('Latest notifications retrieved', notifications));
        }
        catch (error) {
            return res.status(500).json((0, apiResponse_1.errorResponse)('Failed to fetch latest notifications'));
        }
    };
    static markAsRead = async (req, res) => {
        try {
            const notification = await Notification_1.Notification.findOneAndUpdate({ _id: req.params.id, recipient: req.user._id }, { isRead: true, readAt: new Date() }, { new: true });
            if (!notification)
                return res.status(404).json((0, apiResponse_1.errorResponse)('Notification not found'));
            return res.status(200).json((0, apiResponse_1.successResponse)('Notification marked as read', notification));
        }
        catch (error) {
            return res.status(500).json((0, apiResponse_1.errorResponse)('Failed to mark notification as read'));
        }
    };
    static markAllAsRead = async (req, res) => {
        try {
            await Notification_1.Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true, readAt: new Date() });
            return res.status(200).json((0, apiResponse_1.successResponse)('All notifications marked as read', null));
        }
        catch (error) {
            return res.status(500).json((0, apiResponse_1.errorResponse)('Failed to mark all as read'));
        }
    };
    static deleteNotification = async (req, res) => {
        try {
            const deleted = await Notification_1.Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user._id });
            if (!deleted)
                return res.status(404).json((0, apiResponse_1.errorResponse)('Notification not found'));
            return res.status(200).json((0, apiResponse_1.successResponse)('Notification deleted', null));
        }
        catch (error) {
            return res.status(500).json((0, apiResponse_1.errorResponse)('Failed to delete notification'));
        }
    };
    static bulkDelete = async (req, res) => {
        try {
            const { ids } = req.body;
            if (!ids || !Array.isArray(ids))
                return res.status(400).json((0, apiResponse_1.errorResponse)('Invalid payload'));
            await Notification_1.Notification.deleteMany({ _id: { $in: ids }, recipient: req.user._id });
            return res.status(200).json((0, apiResponse_1.successResponse)('Notifications deleted', null));
        }
        catch (error) {
            return res.status(500).json((0, apiResponse_1.errorResponse)('Failed to bulk delete notifications'));
        }
    };
    // Preferences
    static getPreferences = async (req, res) => {
        try {
            let prefs = await NotificationPreference_1.NotificationPreference.findOne({ user: req.user._id });
            if (!prefs) {
                prefs = await NotificationPreference_1.NotificationPreference.create({ user: req.user._id });
            }
            return res.status(200).json((0, apiResponse_1.successResponse)('Preferences retrieved', prefs));
        }
        catch (error) {
            return res.status(500).json((0, apiResponse_1.errorResponse)('Failed to fetch preferences'));
        }
    };
    static updatePreferences = async (req, res) => {
        try {
            const prefs = await NotificationPreference_1.NotificationPreference.findOneAndUpdate({ user: req.user._id }, { $set: req.body }, { new: true, upsert: true });
            return res.status(200).json((0, apiResponse_1.successResponse)('Preferences updated', prefs));
        }
        catch (error) {
            return res.status(500).json((0, apiResponse_1.errorResponse)('Failed to update preferences'));
        }
    };
}
exports.NotificationController = NotificationController;
