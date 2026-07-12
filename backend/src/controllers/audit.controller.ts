import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Audit from '../models/Audit';
import AuditItem from '../models/AuditItem';
import AuditHistory from '../models/AuditHistory';
import Asset from '../models/Asset';
import { createAuditSchema, verifyAssetSchema, completeAuditSchema } from '../validators/audit.validator';
import { successResponse, errorResponse } from '../utils/apiResponse';
import { UserRole } from '../models/User';

// ── Helpers ───────────────────────────────────────────────────────────────────
async function generateAuditNumber(): Promise<string> {
  const count = await Audit.countDocuments();
  const num = String(count + 1).padStart(5, '0');
  return `AUD-${num}`;
}

function getRbacQuery(user: any) {
  const role = user.role as UserRole;
  if (role === UserRole.ADMIN || role === UserRole.ASSET_MANAGER) return {};
  if (role === UserRole.DEPARTMENT_HEAD) return { departmentId: user.departmentId };
  return {}; // EMPLOYEE sees all audits but item access is filtered
}

export class AuditController {

  // GET /api/audit/stats
  static getStats = async (req: Request, res: Response) => {
    try {
      const roleQuery = getRbacQuery(req.user);

      // Asset scoping
      const assetQuery: any = {};
      if (req.user!.role === UserRole.DEPARTMENT_HEAD) assetQuery.department = req.user!.departmentId;
      if (req.user!.role === UserRole.EMPLOYEE) assetQuery.assignedTo = req.user!._id;

      const [
        totalAssets,
        auditedAssets,
        pendingVerification,
        missingAssets,
        damagedAssets,
        completedAudits,
      ] = await Promise.all([
        Asset.countDocuments(assetQuery),
        AuditItem.countDocuments({ verificationStatus: { $ne: 'PENDING' } }),
        AuditItem.countDocuments({ verificationStatus: 'PENDING' }),
        AuditItem.countDocuments({ verificationStatus: 'MISSING' }),
        AuditItem.countDocuments({ verificationStatus: 'DAMAGED' }),
        Audit.countDocuments({ ...roleQuery, status: 'COMPLETED' }),
      ]);

      return res.status(200).json(successResponse('Audit stats retrieved', {
        totalAssets,
        auditedAssets,
        pendingVerification,
        missingAssets,
        damagedAssets,
        completedAudits,
      }));
    } catch (error) {
      console.error('Audit stats error:', error);
      return res.status(500).json(errorResponse('Failed to fetch audit stats'));
    }
  };

  // GET /api/audit
  static getAudits = async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const query: any = { ...getRbacQuery(req.user) };
      if (req.query.status) query.status = req.query.status;
      if (req.query.departmentId) query.departmentId = req.query.departmentId;
      if (req.query.search) {
        query.$or = [
          { name: { $regex: req.query.search, $options: 'i' } },
          { auditNumber: { $regex: req.query.search, $options: 'i' } },
        ];
      }

      const total = await Audit.countDocuments(query);
      const audits = await Audit.find(query)
        .populate('departmentId', 'name')
        .populate('categoryId', 'name code')
        .populate('createdBy', 'firstName lastName')
        .populate('assignedAuditor', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      return res.status(200).json(successResponse('Audits retrieved', audits, {
        total, page, pages: Math.ceil(total / limit) || 1,
      }));
    } catch (error) {
      return res.status(500).json(errorResponse('Failed to fetch audits'));
    }
  };

  // GET /api/audit/history
  static getHistory = async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const query: any = {};

      // EMPLOYEE scoping — only see history for their assets
      if (req.user!.role === UserRole.EMPLOYEE) {
        const myAssets = await Asset.find({ assignedTo: req.user!._id }).select('_id').lean();
        query.assetId = { $in: myAssets.map((a: any) => a._id) };
      }

      const total = await AuditHistory.countDocuments(query);
      const history = await AuditHistory.find(query)
        .populate('auditId', 'auditNumber name status')
        .populate('assetId', 'name tag')
        .populate('performedBy', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      return res.status(200).json(successResponse('Audit history retrieved', history, {
        total, page, pages: Math.ceil(total / limit) || 1,
      }));
    } catch (error) {
      return res.status(500).json(errorResponse('Failed to fetch audit history'));
    }
  };

  // GET /api/audit/discrepancies
  static getDiscrepancies = async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const query: any = {
        verificationStatus: { $in: ['MISSING', 'DAMAGED', 'RETIRED'] },
      };

      // RBAC: dept head only sees their dept's items
      if (req.user!.role === UserRole.DEPARTMENT_HEAD) {
        const deptAssets = await Asset.find({ department: req.user!.departmentId }).select('_id').lean();
        query.assetId = { $in: deptAssets.map((a: any) => a._id) };
      } else if (req.user!.role === UserRole.EMPLOYEE) {
        const myAssets = await Asset.find({ assignedTo: req.user!._id }).select('_id').lean();
        query.assetId = { $in: myAssets.map((a: any) => a._id) };
      }

      const total = await AuditItem.countDocuments(query);
      const items = await AuditItem.find(query)
        .populate('auditId', 'auditNumber name status')
        .populate({
          path: 'assetId',
          select: 'name tag department assignedTo',
          populate: [
            { path: 'department', select: 'name' },
            { path: 'assignedTo', select: 'firstName lastName' },
          ],
        })
        .populate('verifiedBy', 'firstName lastName')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      return res.status(200).json(successResponse('Discrepancies retrieved', items, {
        total, page, pages: Math.ceil(total / limit) || 1,
      }));
    } catch (error) {
      return res.status(500).json(errorResponse('Failed to fetch discrepancies'));
    }
  };

  // GET /api/audit/:id
  static getById = async (req: Request, res: Response) => {
    try {
      const audit = await Audit.findById(req.params.id)
        .populate('departmentId', 'name')
        .populate('categoryId', 'name')
        .populate('createdBy', 'firstName lastName')
        .populate('assignedAuditor', 'firstName lastName')
        .lean();

      if (!audit) return res.status(404).json(errorResponse('Audit not found'));

      const items = await AuditItem.find({ auditId: req.params.id })
        .populate('assetId', 'name tag category department assignedTo condition status')
        .populate('verifiedBy', 'firstName lastName')
        .lean();

      return res.status(200).json(successResponse('Audit retrieved', { ...audit, items }));
    } catch (error) {
      return res.status(500).json(errorResponse('Failed to fetch audit'));
    }
  };

  // POST /api/audit
  static createAudit = async (req: Request, res: Response) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const data = createAuditSchema.parse(req.body);

      // RBAC: DEPT_HEAD can only start for own department
      if (req.user!.role === UserRole.DEPARTMENT_HEAD) {
        if (data.departmentId && data.departmentId !== req.user!.departmentId?.toString()) {
          throw new Error('You can only start audits for your own department');
        }
        data.departmentId = req.user!.departmentId?.toString();
      }

      const auditNumber = await generateAuditNumber();

      // Build asset query to scope the audit
      const assetQuery: any = { status: { $ne: 'RETIRED' } };
      if (data.departmentId) assetQuery.department = data.departmentId;
      if (data.categoryId) assetQuery.category = data.categoryId;

      const assets = await Asset.find(assetQuery).select('_id').lean();

      const [audit] = await Audit.create([{
        auditNumber,
        name: data.name,
        departmentId: data.departmentId || undefined,
        categoryId: data.categoryId || undefined,
        createdBy: req.user!._id,
        assignedAuditor: data.assignedAuditor,
        status: 'OPEN',
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        remarks: data.remarks,
      }] as any, { session });

      // Create AuditItems for all scoped assets
      if (assets.length > 0) {
        const auditItems = assets.map((asset: any) => ({
          auditId: audit._id,
          assetId: asset._id,
          verificationStatus: 'PENDING',
        }));
        await AuditItem.insertMany(auditItems, { session });
      }

      // Create history
      await AuditHistory.create([{
        auditId: audit._id,
        action: 'CREATED',
        performedBy: req.user!._id,
        remarks: `Audit ${auditNumber} created with ${assets.length} assets`,
      }] as any, { session });

      await session.commitTransaction();

      const populated = await Audit.findById(audit._id)
        .populate('departmentId', 'name')
        .populate('categoryId', 'name')
        .populate('assignedAuditor', 'firstName lastName')
        .lean();

      return res.status(201).json(successResponse('Audit started successfully', { ...populated, assetCount: assets.length }));
    } catch (error: any) {
      await session.abortTransaction();
      if (error.name === 'ZodError') {
        const issues = (error as any).errors || (error as any).issues || [];
        return res.status(400).json(errorResponse(issues[0]?.message || 'Validation failed'));
      }
      return res.status(400).json(errorResponse(error.message || 'Failed to create audit'));
    } finally {
      session.endSession();
    }
  };

  // PUT /api/audit/:id/start (set to IN_PROGRESS)
  static startAudit = async (req: Request, res: Response) => {
    try {
      const audit = await Audit.findById(req.params.id);
      if (!audit) return res.status(404).json(errorResponse('Audit not found'));
      if (audit.status !== 'OPEN') return res.status(400).json(errorResponse('Only OPEN audits can be started'));

      audit.status = 'IN_PROGRESS';
      await audit.save();

      await AuditHistory.create({
        auditId: audit._id,
        action: 'UPDATED',
        performedBy: req.user!._id,
        remarks: 'Audit set to IN_PROGRESS',
      });

      return res.status(200).json(successResponse('Audit started', audit));
    } catch (error: any) {
      return res.status(500).json(errorResponse(error.message || 'Failed to start audit'));
    }
  };

  // PUT /api/audit/:id/verify
  static verifyAsset = async (req: Request, res: Response) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const data = verifyAssetSchema.parse(req.body);
      const audit = await Audit.findById(req.params.id).session(session);
      if (!audit) throw new Error('Audit not found');
      if (audit.status === 'COMPLETED' || audit.status === 'CANCELLED') {
        throw new Error('Cannot verify assets in a completed or cancelled audit');
      }

      // RBAC: DEPT_HEAD can only verify their dept assets
      if (req.user!.role === UserRole.DEPARTMENT_HEAD) {
        const asset = await Asset.findById(data.assetId);
        if (!asset || asset.department?.toString() !== req.user!.departmentId?.toString()) {
          throw new Error('You can only verify assets from your own department');
        }
      }

      // Upsert AuditItem
      let item = await AuditItem.findOne({ auditId: req.params.id, assetId: data.assetId }).session(session);
      if (!item) {
        // New item — create it (asset added mid-audit)
        const [created] = await AuditItem.create([{
          auditId: req.params.id,
          assetId: data.assetId,
          verificationStatus: data.verificationStatus,
          condition: data.condition,
          remarks: data.remarks,
          verifiedBy: req.user!._id,
          verifiedAt: new Date(),
        }] as any, { session });
        item = created;
      } else {
        item.verificationStatus = data.verificationStatus as any;
        item.condition = data.condition as any;
        item.remarks = data.remarks || item.remarks;
        item.verifiedBy = req.user!._id as any;
        item.verifiedAt = new Date();
        await item.save({ session });
      }

      // If IN_PROGRESS, update audit status
      if (audit.status === 'OPEN') {
        audit.status = 'IN_PROGRESS';
        await audit.save({ session });
      }

      // Create history
      await AuditHistory.create([{
        auditId: req.params.id,
        assetId: data.assetId,
        action: 'VERIFIED',
        performedBy: req.user!._id,
        remarks: `${data.verificationStatus}${data.remarks ? ': ' + data.remarks : ''}`,
      }] as any, { session });

      await session.commitTransaction();
      return res.status(200).json(successResponse('Asset verified successfully', item));
    } catch (error: any) {
      await session.abortTransaction();
      if (error.name === 'ZodError') {
        const issues = (error as any).errors || (error as any).issues || [];
        return res.status(400).json(errorResponse(issues[0]?.message || 'Validation failed'));
      }
      return res.status(400).json(errorResponse(error.message || 'Failed to verify asset'));
    } finally {
      session.endSession();
    }
  };

  // PUT /api/audit/:id/complete
  static completeAudit = async (req: Request, res: Response) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const data = completeAuditSchema.parse(req.body);
      const audit = await Audit.findById(req.params.id).session(session);
      if (!audit) throw new Error('Audit not found');
      if (audit.status === 'COMPLETED') throw new Error('Audit is already completed');
      if (audit.status === 'CANCELLED') throw new Error('Cannot complete a cancelled audit');

      // Check if all items are verified
      const pendingCount = await AuditItem.countDocuments({
        auditId: req.params.id,
        verificationStatus: 'PENDING',
      });
      if (pendingCount > 0) {
        throw new Error(`${pendingCount} asset(s) still pending verification. Complete all verifications first.`);
      }

      audit.status = 'COMPLETED';
      audit.endDate = new Date();
      audit.remarks = data.remarks || audit.remarks;
      await audit.save({ session });

      await AuditHistory.create([{
        auditId: audit._id,
        action: 'COMPLETED',
        performedBy: req.user!._id,
        remarks: data.remarks || 'Audit completed',
      }] as any, { session });

      await session.commitTransaction();
      return res.status(200).json(successResponse('Audit completed successfully', audit));
    } catch (error: any) {
      await session.abortTransaction();
      if (error.name === 'ZodError') {
        const issues = (error as any).errors || (error as any).issues || [];
        return res.status(400).json(errorResponse(issues[0]?.message || 'Validation failed'));
      }
      return res.status(400).json(errorResponse(error.message || 'Failed to complete audit'));
    } finally {
      session.endSession();
    }
  };
}
