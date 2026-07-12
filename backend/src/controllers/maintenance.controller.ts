import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Maintenance, { MaintenanceStatus } from '../models/Maintenance';
import MaintenanceHistory, { MaintenanceHistoryAction } from '../models/MaintenanceHistory';
import Asset from '../models/Asset';
import { UserRole } from '../models/User';
import {
  assignMaintenanceSchema,
  createMaintenanceSchema,
  updateMaintenanceStatusSchema,
} from '../validators/maintenance.validator';
import { successResponse, errorResponse } from '../utils/apiResponse';

const MANAGER_ROLES = [UserRole.ADMIN, UserRole.ASSET_MANAGER];

function isManager(role?: UserRole) {
  return !!role && MANAGER_ROLES.includes(role);
}

function getRbacQuery(user: any) {
  const role = user.role as UserRole;
  if (isManager(role)) return {};
  if (role === UserRole.TECHNICIAN) return { assignedTechnicianId: user._id };
  if (role === UserRole.DEPARTMENT_HEAD) return { departmentId: user.departmentId };
  return { reportedBy: user._id };
}

function canAccessMaintenance(user: any, maintenance: any) {
  const role = user.role as UserRole;
  if (isManager(role)) return true;
  if (role === UserRole.TECHNICIAN) {
    return maintenance.assignedTechnicianId?.toString() === user._id.toString();
  }
  if (role === UserRole.DEPARTMENT_HEAD) {
    return maintenance.departmentId?.toString() === user.departmentId?.toString();
  }
  return maintenance.reportedBy?.toString() === user._id.toString();
}

function actionForStatus(status: MaintenanceStatus): MaintenanceHistoryAction {
  if (status === 'ASSIGNED') return 'ASSIGNED';
  if (status === 'IN_PROGRESS') return 'STARTED';
  if (status === 'COMPLETED') return 'COMPLETED';
  if (status === 'CANCELLED') return 'CANCELLED';
  return 'CREATED';
}

async function generateRequestId(session: mongoose.ClientSession) {
  const year = new Date().getFullYear();
  const prefix = `MR-${year}-`;
  const latest = await Maintenance.findOne({ requestId: { $regex: `^${prefix}` } })
    .sort({ createdAt: -1 })
    .select('requestId')
    .session(session)
    .lean();
  const next = latest?.requestId ? Number(latest.requestId.replace(prefix, '')) + 1 : 1;
  return `${prefix}${String(next).padStart(5, '0')}`;
}

async function createHistory(
  maintenance: any,
  action: MaintenanceHistoryAction,
  performedBy: mongoose.Types.ObjectId,
  remarks?: string | null,
  session?: mongoose.ClientSession
) {
  await MaintenanceHistory.create([{
    maintenanceId: maintenance._id,
    assetId: maintenance.assetId,
    action,
    status: maintenance.status,
    performedBy,
    assignedTechnicianId: maintenance.assignedTechnicianId,
    remarks: remarks || undefined,
  }] as any, { session });
}

export class MaintenanceController {
  static getStats = async (req: Request, res: Response) => {
    try {
      const baseQuery = getRbacQuery(req.user);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [openRequests, assigned, inProgress, completed, overdue, assetsUnderMaintenance] = await Promise.all([
        Maintenance.countDocuments({ ...baseQuery, status: 'OPEN' }),
        Maintenance.countDocuments({ ...baseQuery, status: 'ASSIGNED' }),
        Maintenance.countDocuments({ ...baseQuery, status: 'IN_PROGRESS' }),
        Maintenance.countDocuments({ ...baseQuery, status: 'COMPLETED' }),
        Maintenance.countDocuments({
          ...baseQuery,
          status: { $in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS'] },
          scheduledDate: { $lt: today },
        }),
        Asset.countDocuments({ status: 'MAINTENANCE' }),
      ]);

      return res.status(200).json(successResponse('Maintenance stats retrieved', {
        openRequests,
        assigned,
        inProgress,
        completed,
        overdue,
        assetsUnderMaintenance,
      }));
    } catch (error) {
      return res.status(500).json(errorResponse('Failed to fetch maintenance stats'));
    }
  };

  static getMaintenance = async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const query: any = { ...getRbacQuery(req.user) };
      if (req.query.status) query.status = req.query.status;
      if (req.query.departmentId) query.departmentId = req.query.departmentId;
      if (req.query.categoryId) query.categoryId = req.query.categoryId;
      if (req.query.technicianId) query.assignedTechnicianId = req.query.technicianId;
      if (req.query.priority) query.priority = req.query.priority;
      if (req.query.search) {
        query.$or = [
          { requestId: { $regex: req.query.search, $options: 'i' } },
          { title: { $regex: req.query.search, $options: 'i' } },
          { description: { $regex: req.query.search, $options: 'i' } },
        ];
      }
      if (req.query.dateFrom || req.query.dateTo) {
        query.createdAt = {};
        if (req.query.dateFrom) query.createdAt.$gte = new Date(req.query.dateFrom as string);
        if (req.query.dateTo) {
          const to = new Date(req.query.dateTo as string);
          to.setHours(23, 59, 59, 999);
          query.createdAt.$lte = to;
        }
      }

      const total = await Maintenance.countDocuments(query);
      const records = await Maintenance.find(query)
        .populate('assetId', 'name tag status')
        .populate('categoryId', 'name code')
        .populate('departmentId', 'name')
        .populate('reportedBy', 'firstName lastName email')
        .populate('assignedTechnicianId', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      return res.status(200).json(successResponse('Maintenance records retrieved', records, {
        total,
        page,
        pages: Math.ceil(total / limit) || 1,
      }));
    } catch (error) {
      return res.status(500).json(errorResponse('Failed to fetch maintenance records'));
    }
  };

  static getHistory = async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const maintenanceQuery = getRbacQuery(req.user);
      const scoped = await Maintenance.find(maintenanceQuery).select('_id').lean();
      const query: any = { maintenanceId: { $in: scoped.map((item) => item._id) } };

      if (req.query.status) query.status = req.query.status;
      if (req.query.action) query.action = req.query.action;
      if (req.query.dateFrom || req.query.dateTo) {
        query.createdAt = {};
        if (req.query.dateFrom) query.createdAt.$gte = new Date(req.query.dateFrom as string);
        if (req.query.dateTo) {
          const to = new Date(req.query.dateTo as string);
          to.setHours(23, 59, 59, 999);
          query.createdAt.$lte = to;
        }
      }

      const total = await MaintenanceHistory.countDocuments(query);
      const history = await MaintenanceHistory.find(query)
        .populate('maintenanceId', 'requestId title status')
        .populate('assetId', 'name tag')
        .populate('performedBy', 'firstName lastName')
        .populate('assignedTechnicianId', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      return res.status(200).json(successResponse('Maintenance history retrieved', history, {
        total,
        page,
        pages: Math.ceil(total / limit) || 1,
      }));
    } catch (error) {
      return res.status(500).json(errorResponse('Failed to fetch maintenance history'));
    }
  };

  static getCalendar = async (req: Request, res: Response) => {
    try {
      const query: any = { ...getRbacQuery(req.user) };
      if (req.query.dateFrom || req.query.dateTo) {
        query.scheduledDate = {};
        if (req.query.dateFrom) query.scheduledDate.$gte = new Date(req.query.dateFrom as string);
        if (req.query.dateTo) {
          const to = new Date(req.query.dateTo as string);
          to.setHours(23, 59, 59, 999);
          query.scheduledDate.$lte = to;
        }
      } else {
        query.scheduledDate = { $exists: true };
      }

      const records = await Maintenance.find(query)
        .populate('assetId', 'name tag')
        .populate('departmentId', 'name')
        .populate('assignedTechnicianId', 'firstName lastName')
        .sort({ scheduledDate: 1, createdAt: 1 })
        .lean();

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const events = records.map((item: any) => ({
        id: item._id,
        requestId: item.requestId,
        title: `${item.requestId} - ${item.assetId?.name || 'Asset'}`,
        date: item.scheduledDate || item.createdAt,
        status: item.status,
        isOverdue: item.scheduledDate && new Date(item.scheduledDate) < today && !['COMPLETED', 'CANCELLED'].includes(item.status),
        asset: item.assetId,
        department: item.departmentId,
        technician: item.assignedTechnicianId,
        priority: item.priority,
        remarks: item.remarks,
      }));

      return res.status(200).json(successResponse('Maintenance calendar retrieved', events));
    } catch (error) {
      return res.status(500).json(errorResponse('Failed to fetch maintenance calendar'));
    }
  };

  static getById = async (req: Request, res: Response) => {
    try {
      const record = await Maintenance.findById(req.params.id)
        .populate('assetId', 'name tag serialNumber status')
        .populate('categoryId', 'name code')
        .populate('departmentId', 'name')
        .populate('reportedBy', 'firstName lastName email')
        .populate('assignedTechnicianId', 'firstName lastName email')
        .lean();

      if (!record) return res.status(404).json(errorResponse('Maintenance request not found'));
      if (!canAccessMaintenance(req.user, record)) return res.status(403).json(errorResponse('Access denied'));

      return res.status(200).json(successResponse('Maintenance request retrieved', record));
    } catch (error) {
      return res.status(500).json(errorResponse('Failed to fetch maintenance request'));
    }
  };

  static createMaintenance = async (req: Request, res: Response) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const data = createMaintenanceSchema.parse(req.body);
      const role = req.user!.role as UserRole;

      if (role === UserRole.EMPLOYEE && data.reportedBy !== req.user!._id.toString()) {
        throw new Error('Employees can only create maintenance requests for themselves');
      }
      if (role === UserRole.DEPARTMENT_HEAD && data.departmentId !== req.user!.departmentId?.toString()) {
        throw new Error('Department heads can only create requests for their department');
      }

      const asset = await Asset.findById(data.assetId).session(session);
      if (!asset) throw new Error('Asset not found');

      const requestId = await generateRequestId(session);
      const [maintenance] = await Maintenance.create([{
        requestId,
        assetId: data.assetId,
        categoryId: data.categoryId,
        departmentId: data.departmentId,
        reportedBy: data.reportedBy,
        priority: data.priority,
        title: data.title,
        description: data.description,
        status: 'OPEN',
        scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : undefined,
        remarks: data.remarks || undefined,
      }] as any, { session });

      await createHistory(maintenance, 'CREATED', req.user!._id, data.remarks, session);
      await session.commitTransaction();

      const populated = await Maintenance.findById(maintenance._id)
        .populate('assetId', 'name tag status')
        .populate('categoryId', 'name')
        .populate('departmentId', 'name')
        .populate('reportedBy', 'firstName lastName')
        .lean();

      return res.status(201).json(successResponse('Maintenance request created successfully', populated));
    } catch (error: any) {
      await session.abortTransaction();
      if (error.name === 'ZodError') {
        const issues = error.errors || error.issues || [];
        return res.status(400).json(errorResponse(issues[0]?.message || 'Validation failed'));
      }
      return res.status(400).json(errorResponse(error.message || 'Failed to create maintenance request'));
    } finally {
      session.endSession();
    }
  };

  static assignTechnician = async (req: Request, res: Response) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const data = assignMaintenanceSchema.parse(req.body);
      const maintenance = await Maintenance.findById(req.params.id).session(session);
      if (!maintenance) throw new Error('Maintenance request not found');
      if (maintenance.status !== 'OPEN') throw new Error('Only OPEN requests can be assigned');

      maintenance.assignedTechnicianId = new mongoose.Types.ObjectId(data.assignedTechnicianId);
      maintenance.scheduledDate = new Date(data.scheduledDate);
      maintenance.status = 'ASSIGNED';
      maintenance.remarks = data.remarks || maintenance.remarks;
      await maintenance.save({ session });

      await createHistory(maintenance, 'ASSIGNED', req.user!._id, data.remarks, session);
      await session.commitTransaction();

      return res.status(200).json(successResponse('Technician assigned successfully', maintenance));
    } catch (error: any) {
      await session.abortTransaction();
      if (error.name === 'ZodError') {
        const issues = error.errors || error.issues || [];
        return res.status(400).json(errorResponse(issues[0]?.message || 'Validation failed'));
      }
      return res.status(400).json(errorResponse(error.message || 'Failed to assign technician'));
    } finally {
      session.endSession();
    }
  };

  static updateStatus = async (req: Request, res: Response) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const data = updateMaintenanceStatusSchema.parse(req.body);
      const maintenance = await Maintenance.findById(req.params.id).session(session);
      if (!maintenance) throw new Error('Maintenance request not found');

      const role = req.user!.role as UserRole;
      if (role === UserRole.TECHNICIAN && maintenance.assignedTechnicianId?.toString() !== req.user!._id.toString()) {
        throw new Error('Technicians can only update assigned jobs');
      }
      if (!isManager(role) && role !== UserRole.TECHNICIAN) {
        throw new Error('You are not allowed to update maintenance status');
      }

      const allowed: Record<MaintenanceStatus, MaintenanceStatus[]> = {
        OPEN: ['CANCELLED'],
        ASSIGNED: ['IN_PROGRESS', 'CANCELLED'],
        IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
        COMPLETED: [],
        CANCELLED: [],
      };
      if (!allowed[maintenance.status].includes(data.status)) {
        throw new Error(`Cannot change status from ${maintenance.status} to ${data.status}`);
      }

      maintenance.status = data.status;
      maintenance.remarks = data.remarks || maintenance.remarks;
      if (data.status === 'IN_PROGRESS') {
        await Asset.findByIdAndUpdate(maintenance.assetId, { status: 'MAINTENANCE' }, { session });
      }
      if (data.status === 'COMPLETED') {
        maintenance.completedDate = new Date();
        await Asset.findByIdAndUpdate(maintenance.assetId, { status: 'AVAILABLE' }, { session });
      }
      await maintenance.save({ session });

      await createHistory(maintenance, actionForStatus(data.status), req.user!._id, data.remarks, session);
      await session.commitTransaction();

      return res.status(200).json(successResponse('Maintenance status updated successfully', maintenance));
    } catch (error: any) {
      await session.abortTransaction();
      if (error.name === 'ZodError') {
        const issues = error.errors || error.issues || [];
        return res.status(400).json(errorResponse(issues[0]?.message || 'Validation failed'));
      }
      return res.status(400).json(errorResponse(error.message || 'Failed to update maintenance status'));
    } finally {
      session.endSession();
    }
  };
}
