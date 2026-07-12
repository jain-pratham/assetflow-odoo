import { Request, Response } from 'express';
import { ActivityLog } from '../models/ActivityLog';
import { successResponse, errorResponse } from '../utils/apiResponse';
import { UserRole } from '../models/User';

export class ActivityLogController {
  
  static getLogs = async (req: Request, res: Response) => {
    try {
      // RBAC for Activity Log
      if (req.user!.role !== UserRole.ADMIN) {
        return res.status(403).json(errorResponse('Forbidden: Admin only'));
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const skip = (page - 1) * limit;

      const query: any = {};
      if (req.query.action) query.action = req.query.action;
      if (req.query.actor) query.actor = req.query.actor;

      const total = await ActivityLog.countDocuments(query);
      const logs = await ActivityLog.find(query)
        .populate('actor', 'firstName lastName email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      return res.status(200).json(successResponse('Activity logs retrieved', logs, {
        total, page, pages: Math.ceil(total / limit) || 1
      }));
    } catch (error) {
      return res.status(500).json(errorResponse('Failed to fetch activity logs'));
    }
  };
}
