"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityLogController = void 0;
const ActivityLog_1 = require("../models/ActivityLog");
const apiResponse_1 = require("../utils/apiResponse");
const User_1 = require("../models/User");
class ActivityLogController {
    static getLogs = async (req, res) => {
        try {
            // RBAC for Activity Log
            if (req.user.role !== User_1.UserRole.ADMIN) {
                return res.status(403).json((0, apiResponse_1.errorResponse)('Forbidden: Admin only'));
            }
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50;
            const skip = (page - 1) * limit;
            const query = {};
            if (req.query.action)
                query.action = req.query.action;
            if (req.query.actor)
                query.actor = req.query.actor;
            const total = await ActivityLog_1.ActivityLog.countDocuments(query);
            const logs = await ActivityLog_1.ActivityLog.find(query)
                .populate('actor', 'firstName lastName email role')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean();
            return res.status(200).json((0, apiResponse_1.successResponse)('Activity logs retrieved', logs, {
                total, page, pages: Math.ceil(total / limit) || 1
            }));
        }
        catch (error) {
            return res.status(500).json((0, apiResponse_1.errorResponse)('Failed to fetch activity logs'));
        }
    };
}
exports.ActivityLogController = ActivityLogController;
