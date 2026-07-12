import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Allocation from '../models/Allocation';
import AllocationHistory from '../models/AllocationHistory';
import Asset from '../models/Asset';
import { allocateAssetSchema, transferAssetSchema, returnAssetSchema } from '../validators/allocation.validator';
import { successResponse, errorResponse } from '../utils/apiResponse';
import { UserRole } from '../models/User';

export class AllocationController {
  
  /**
   * Helper to build the RBAC query for reading allocations
   */
  private static getRbacQuery(user: any) {
    const role = user.role as UserRole;
    if (role === UserRole.ADMIN || role === UserRole.ASSET_MANAGER) return {};
    if (role === UserRole.DEPARTMENT_HEAD) return { departmentId: user.departmentId };
    return { employeeId: user._id };
  }

  static getAllocationStats = async (req: Request, res: Response) => {
    try {
      const baseQuery = AllocationController.getRbacQuery(req.user);

      // Using Asset stats for Available since it's an Asset property
      const assetQuery: any = {};
      if (req.user!.role === UserRole.DEPARTMENT_HEAD) assetQuery.department = req.user!.departmentId;
      if (req.user!.role === UserRole.EMPLOYEE) assetQuery.assignedTo = req.user!._id;

      const [allocated, returned, transfers, available] = await Promise.all([
        Allocation.countDocuments({ ...baseQuery, status: 'ACTIVE' }),
        Allocation.countDocuments({ ...baseQuery, status: 'RETURNED' }),
        AllocationHistory.countDocuments({ ...baseQuery, action: 'TRANSFERRED' }),
        Asset.countDocuments({ ...assetQuery, status: 'AVAILABLE' })
      ]);

      return res.status(200).json(successResponse('Allocation stats retrieved', {
        allocated, returned, transfers, available
      }));
    } catch (error) {
      console.error('Get allocation stats error:', error);
      return res.status(500).json(errorResponse('Failed to fetch allocation stats'));
    }
  };

  static getAllocations = async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const query: any = { ...AllocationController.getRbacQuery(req.user) };

      if (req.query.status) query.status = req.query.status;
      if (req.query.departmentId) query.departmentId = req.query.departmentId;
      if (req.query.employeeId) query.employeeId = req.query.employeeId;

      const total = await Allocation.countDocuments(query);
      const allocations = await Allocation.find(query)
        .populate('assetId', 'name tag serialNumber condition')
        .populate('employeeId', 'firstName lastName email')
        .populate('departmentId', 'name')
        .populate('allocatedBy', 'firstName lastName')
        .sort({ allocatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      return res.status(200).json(successResponse('Allocations retrieved', allocations, {
        total, page, pages: Math.ceil(total / limit) || 1
      }));
    } catch (error) {
      return res.status(500).json(errorResponse('Failed to fetch allocations'));
    }
  };

  static getHistory = async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const query: any = { ...AllocationController.getRbacQuery(req.user) };

      const total = await AllocationHistory.countDocuments(query);
      const history = await AllocationHistory.find(query)
        .populate('assetId', 'name tag')
        .populate('oldEmployeeId', 'firstName lastName')
        .populate('newEmployeeId', 'firstName lastName')
        .populate('oldDepartmentId', 'name')
        .populate('newDepartmentId', 'name')
        .populate('performedBy', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      return res.status(200).json(successResponse('Allocation history retrieved', history, {
        total, page, pages: Math.ceil(total / limit) || 1
      }));
    } catch (error) {
      return res.status(500).json(errorResponse('Failed to fetch allocation history'));
    }
  };

  static allocateAsset = async (req: Request, res: Response) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const validatedData = allocateAssetSchema.parse(req.body);

      // RBAC check: Dept Head can only allocate to their own department
      if (req.user!.role === UserRole.DEPARTMENT_HEAD && validatedData.departmentId !== req.user!.departmentId?.toString()) {
        throw new Error('You can only allocate assets within your department');
      }

      const asset = await Asset.findById(validatedData.assetId).session(session);
      if (!asset) throw new Error('Asset not found');
      if (asset.status !== 'AVAILABLE') throw new Error('Asset is not available for allocation');

      // Create Allocation
      const allocation = await Allocation.create([{
        assetId: validatedData.assetId,
        employeeId: validatedData.employeeId,
        departmentId: validatedData.departmentId,
        allocatedBy: req.user!._id,
        allocatedAt: validatedData.allocatedAt || new Date(),
        expectedReturnDate: validatedData.expectedReturnDate,
        status: 'ACTIVE',
        remarks: validatedData.remarks
      }] as any, { session });

      // Update Asset Status & AssignedTo
      asset.status = 'ALLOCATED';
      asset.assignedTo = new mongoose.Types.ObjectId(validatedData.employeeId);
      asset.department = new mongoose.Types.ObjectId(validatedData.departmentId);
      await asset.save({ session });

      // Create History
      await AllocationHistory.create([{
        allocationId: allocation[0]._id,
        assetId: asset._id,
        action: 'ALLOCATED',
        newEmployeeId: validatedData.employeeId,
        newDepartmentId: validatedData.departmentId,
        performedBy: req.user!._id,
        remarks: validatedData.remarks
      }] as any, { session });

      await session.commitTransaction();
      return res.status(201).json(successResponse('Asset allocated successfully', allocation[0]));
    } catch (error: any) {
      await session.abortTransaction();
      if (error.name === 'ZodError') return res.status(400).json(errorResponse(error.errors[0].message));
      return res.status(400).json(errorResponse(error.message || 'Failed to allocate asset'));
    } finally {
      session.endSession();
    }
  };

  static transferAsset = async (req: Request, res: Response) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const { id } = req.params; // allocationId
      const validatedData = transferAssetSchema.parse(req.body);

      const allocation = await Allocation.findById(id).session(session);
      if (!allocation || allocation.status !== 'ACTIVE') throw new Error('Active allocation not found');

      // RBAC Check
      if (req.user!.role === UserRole.DEPARTMENT_HEAD) {
        if (allocation.departmentId.toString() !== req.user!.departmentId?.toString()) {
          throw new Error('You can only transfer assets within your department');
        }
        if (validatedData.newDepartmentId !== req.user!.departmentId?.toString()) {
           throw new Error('You cannot transfer assets out of your department');
        }
      }

      const oldEmployeeId = allocation.employeeId;
      const oldDepartmentId = allocation.departmentId;

      // Update Allocation
      allocation.employeeId = new mongoose.Types.ObjectId(validatedData.newEmployeeId);
      allocation.departmentId = new mongoose.Types.ObjectId(validatedData.newDepartmentId);
      allocation.remarks = validatedData.remarks || allocation.remarks;
      await allocation.save({ session });

      // Update Asset
      const asset = await Asset.findById(allocation.assetId).session(session);
      if (asset) {
        asset.assignedTo = new mongoose.Types.ObjectId(validatedData.newEmployeeId);
        asset.department = new mongoose.Types.ObjectId(validatedData.newDepartmentId);
        await asset.save({ session });
      }

      // Create History
      await AllocationHistory.create([{
        allocationId: allocation._id,
        assetId: allocation.assetId,
        action: 'TRANSFERRED',
        oldEmployeeId,
        newEmployeeId: validatedData.newEmployeeId,
        oldDepartmentId,
        newDepartmentId: validatedData.newDepartmentId,
        performedBy: req.user!._id,
        remarks: validatedData.remarks
      }] as any, { session });

      await session.commitTransaction();
      return res.status(200).json(successResponse('Asset transferred successfully', allocation));
    } catch (error: any) {
      await session.abortTransaction();
      if (error.name === 'ZodError') return res.status(400).json(errorResponse(error.errors[0].message));
      return res.status(400).json(errorResponse(error.message || 'Failed to transfer asset'));
    } finally {
      session.endSession();
    }
  };

  static returnAsset = async (req: Request, res: Response) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const { id } = req.params; // allocationId
      const validatedData = returnAssetSchema.parse(req.body);

      const allocation = await Allocation.findById(id).session(session);
      if (!allocation || allocation.status !== 'ACTIVE') throw new Error('Active allocation not found');

      // RBAC Check
      if (req.user!.role === UserRole.DEPARTMENT_HEAD && allocation.departmentId.toString() !== req.user!.departmentId?.toString()) {
        throw new Error('You can only return assets from your department');
      }

      // Close Allocation
      allocation.status = 'RETURNED';
      allocation.returnedAt = validatedData.returnedAt ? new Date(validatedData.returnedAt) : new Date();
      allocation.condition = validatedData.condition as any;
      allocation.remarks = validatedData.remarks || allocation.remarks;
      await allocation.save({ session });

      // Update Asset
      const asset = await Asset.findById(allocation.assetId).session(session);
      if (asset) {
        asset.status = 'AVAILABLE';
        asset.assignedTo = undefined;
        asset.condition = validatedData.condition as any;
        await asset.save({ session });
      }

      // Create History
      await AllocationHistory.create([{
        allocationId: allocation._id,
        assetId: allocation.assetId,
        action: 'RETURNED',
        oldEmployeeId: allocation.employeeId,
        oldDepartmentId: allocation.departmentId,
        performedBy: req.user!._id,
        condition: validatedData.condition,
        remarks: validatedData.remarks
      }] as any, { session });

      await session.commitTransaction();
      return res.status(200).json(successResponse('Asset returned successfully', allocation));
    } catch (error: any) {
      await session.abortTransaction();
      if (error.name === 'ZodError') return res.status(400).json(errorResponse(error.errors[0].message));
      return res.status(400).json(errorResponse(error.message || 'Failed to return asset'));
    } finally {
      session.endSession();
    }
  };
}
