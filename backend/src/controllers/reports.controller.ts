import { Request, Response } from 'express';
import { ReportsService } from '../services/reports.service';
import { successResponse, errorResponse } from '../utils/apiResponse';
import { UserRole } from '../models/User';

function getRoleQueries(user: any) {
  const role = user.role as UserRole;
  let roleQuery: any = {};
  let assetQuery: any = {};

  if (role === UserRole.DEPARTMENT_HEAD) {
    roleQuery = { departmentId: user.departmentId };
    assetQuery = { department: user.departmentId };
  } else if (role === UserRole.EMPLOYEE) {
    roleQuery = { employeeId: user._id };
    assetQuery = { assignedTo: user._id };
  }
  return { roleQuery, assetQuery };
}

export class ReportsController {

  static getDashboard = async (req: Request, res: Response) => {
    try {
      const { roleQuery, assetQuery } = getRoleQueries(req.user);
      const stats = await ReportsService.getDashboardStats(roleQuery, assetQuery);
      return res.status(200).json(successResponse('Dashboard stats retrieved', stats));
    } catch (error) {
      console.error(error);
      return res.status(500).json(errorResponse('Failed to fetch dashboard stats'));
    }
  };

  static getCharts = async (req: Request, res: Response) => {
    try {
      const { roleQuery, assetQuery } = getRoleQueries(req.user);
      const charts = await ReportsService.getCharts(roleQuery, assetQuery);
      return res.status(200).json(successResponse('Charts retrieved', charts));
    } catch (error) {
      console.error(error);
      return res.status(500).json(errorResponse('Failed to fetch charts'));
    }
  };

  static getAssetReport = async (req: Request, res: Response) => {
    try {
      const { assetQuery } = getRoleQueries(req.user);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      
      const query = { ...assetQuery };
      if (req.query.search) query.name = { $regex: req.query.search, $options: 'i' };
      if (req.query.status) query.status = req.query.status;
      if (req.query.departmentId) query.department = req.query.departmentId;
      if (req.query.categoryId) query.category = req.query.categoryId;

      const { data, total } = await ReportsService.getAssetsReport(query, limit, (page - 1) * limit);
      return res.status(200).json(successResponse('Asset report retrieved', data, { total, page, pages: Math.ceil(total / limit) || 1 }));
    } catch (error) {
      return res.status(500).json(errorResponse('Failed to fetch asset report'));
    }
  };

  static getBookingReport = async (req: Request, res: Response) => {
    try {
      const { roleQuery } = getRoleQueries(req.user);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      const query = { ...roleQuery };
      if (req.query.status) query.status = req.query.status;
      if (req.query.departmentId) query.departmentId = req.query.departmentId;

      const { data, total } = await ReportsService.getBookingsReport(query, limit, (page - 1) * limit);
      return res.status(200).json(successResponse('Booking report retrieved', data, { total, page, pages: Math.ceil(total / limit) || 1 }));
    } catch (error) {
      return res.status(500).json(errorResponse('Failed to fetch booking report'));
    }
  };

  static getMaintenanceReport = async (req: Request, res: Response) => {
    try {
      const { roleQuery } = getRoleQueries(req.user); // Using same role override (technician/dept)
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      const query = { ...roleQuery };
      if (req.query.status) query.status = req.query.status;
      if (req.query.priority) query.priority = req.query.priority;

      const { data, total } = await ReportsService.getMaintenanceReport(query, limit, (page - 1) * limit);
      return res.status(200).json(successResponse('Maintenance report retrieved', data, { total, page, pages: Math.ceil(total / limit) || 1 }));
    } catch (error) {
      return res.status(500).json(errorResponse('Failed to fetch maintenance report'));
    }
  };

  static getAuditReport = async (req: Request, res: Response) => {
    try {
      const { roleQuery } = getRoleQueries(req.user);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      const query = { ...roleQuery };
      if (req.query.status) query.status = req.query.status;
      if (req.query.departmentId) query.departmentId = req.query.departmentId;

      const { data, total } = await ReportsService.getAuditReport(query, limit, (page - 1) * limit);
      return res.status(200).json(successResponse('Audit report retrieved', data, { total, page, pages: Math.ceil(total / limit) || 1 }));
    } catch (error) {
      return res.status(500).json(errorResponse('Failed to fetch audit report'));
    }
  };
}
