import { Request, Response } from 'express';
import Asset from '../models/Asset';
import { createAssetSchema, updateAssetSchema } from '../validators/asset.validator';
import { successResponse, errorResponse } from '../utils/apiResponse';
import { User, UserRole } from '../models/User';
import { NotificationService } from '../services/notification.service';

export class AssetController {
  
  /**
   * Helper to build the RBAC base query for Assets
   */
  private static getRbacQuery(user: any) {
    const role = user.role as UserRole;
    if (role === UserRole.ADMIN || role === UserRole.ASSET_MANAGER) {
      return {}; // Full access
    }
    if (role === UserRole.DEPARTMENT_HEAD) {
      return { department: user.departmentId };
    }
    // EMPLOYEE
    return { assignedTo: user._id };
  }

  static getAssetStats = async (req: Request, res: Response) => {
    try {
      const baseQuery = AssetController.getRbacQuery(req.user);
      
      const [total, available, allocated, maintenance, retired] = await Promise.all([
        Asset.countDocuments(baseQuery),
        Asset.countDocuments({ ...baseQuery, status: 'AVAILABLE' }),
        Asset.countDocuments({ ...baseQuery, status: 'ALLOCATED' }),
        Asset.countDocuments({ ...baseQuery, status: 'MAINTENANCE' }),
        Asset.countDocuments({ ...baseQuery, status: 'RETIRED' }),
      ]);

      return res.status(200).json(successResponse('Asset stats retrieved', {
        total, available, allocated, maintenance, retired
      }));
    } catch (error) {
      console.error('Get asset stats error:', error);
      return res.status(500).json(errorResponse('Failed to fetch asset stats'));
    }
  };

  static getAssets = async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const query: any = AssetController.getRbacQuery(req.user);

      if (req.query.search) {
        query.$or = [
          { name: { $regex: req.query.search, $options: 'i' } },
          { tag: { $regex: req.query.search, $options: 'i' } },
          { serialNumber: { $regex: req.query.search, $options: 'i' } }
        ];
      }

      if (req.query.status) query.status = req.query.status;
      if (req.query.category) query.category = req.query.category;
      if (req.query.department) query.department = req.query.department;
      if (req.query.assignedTo) query.assignedTo = req.query.assignedTo;

      const total = await Asset.countDocuments(query);
      const assets = await Asset.find(query)
        .populate('category', 'name code')
        .populate('department', 'name code')
        .populate('assignedTo', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      return res.status(200).json(successResponse('Assets retrieved', assets, {
        total, page, pages: Math.ceil(total / limit) || 1
      }));
    } catch (error) {
      console.error('Get assets error:', error);
      return res.status(500).json(errorResponse('Failed to fetch assets'));
    }
  };

  static getAssetById = async (req: Request, res: Response) => {
    try {
      const query = { _id: req.params.id, ...AssetController.getRbacQuery(req.user) };
      const asset = await Asset.findOne(query)
        .populate('category', 'name code')
        .populate('department', 'name code')
        .populate('assignedTo', 'firstName lastName email')
        .lean();
      
      if (!asset) return res.status(404).json(errorResponse('Asset not found or access denied'));
      return res.status(200).json(successResponse('Asset retrieved', asset));
    } catch (error) {
      return res.status(500).json(errorResponse('Failed to fetch asset'));
    }
  };

  static createAsset = async (req: Request, res: Response) => {
    try {
      const validatedData = createAssetSchema.parse(req.body);
      const existingTag = await Asset.findOne({ tag: validatedData.tag });
      if (existingTag) return res.status(409).json(errorResponse('Asset tag already exists'));

      const asset = await Asset.create(validatedData as any);

      // Notify Admins
      const admins = await User.find({ role: UserRole.ADMIN, status: 'ACTIVE' } as any);
      for (const admin of admins) {
        await NotificationService.createNotification({
          title: 'New Asset Registered',
          message: `Asset ${asset.name} (${asset.tag}) has been registered.`,
          type: 'ASSET',
          priority: 'LOW',
          recipient: admin._id as unknown as string,
          entityType: 'Asset',
          entityId: asset._id as unknown as string,
          actionUrl: `/assets/${asset._id}`
        });
      }

      await NotificationService.logActivity({
        actor: req.user!._id as unknown as string,
        action: 'CREATED_ASSET',
        target: asset.tag,
        entityType: 'Asset',
        entityId: asset._id as unknown as string
      });

      return res.status(201).json(successResponse('Asset created successfully', asset));
    } catch (error: any) {
      if (error.name === 'ZodError') return res.status(400).json(errorResponse(error.errors[0].message));
      return res.status(500).json(errorResponse('Failed to create asset'));
    }
  };

  static updateAsset = async (req: Request, res: Response) => {
    try {
      const validatedData = updateAssetSchema.parse(req.body);
      const asset = await Asset.findById(req.params.id);
      if (!asset) return res.status(404).json(errorResponse('Asset not found'));

      if (validatedData.tag && validatedData.tag !== asset.tag) {
        const existingTag = await Asset.findOne({ tag: validatedData.tag, _id: { $ne: asset._id } });
        if (existingTag) return res.status(409).json(errorResponse('Asset tag already exists'));
      }

      const updatedAsset = await Asset.findByIdAndUpdate(req.params.id, { $set: validatedData }, { new: true });
      
      await NotificationService.logActivity({
        actor: req.user!._id as unknown as string,
        action: 'UPDATED_ASSET',
        target: updatedAsset!.tag,
        entityType: 'Asset',
        entityId: updatedAsset!._id as unknown as string
      });

      return res.status(200).json(successResponse('Asset updated successfully', updatedAsset));
    } catch (error: any) {
      if (error.name === 'ZodError') return res.status(400).json(errorResponse(error.errors[0].message));
      return res.status(500).json(errorResponse('Failed to update asset'));
    }
  };

  static toggleAssetStatus = async (req: Request, res: Response) => {
    try {
      const { status } = req.body;
      if (!['AVAILABLE', 'ALLOCATED', 'MAINTENANCE', 'RETIRED'].includes(status)) {
        return res.status(400).json(errorResponse('Invalid status value'));
      }

      const asset = await Asset.findById(req.params.id);
      if (!asset) return res.status(404).json(errorResponse('Asset not found'));

      asset.status = status;
      await asset.save();

      await NotificationService.logActivity({
        actor: req.user!._id as unknown as string,
        action: 'CHANGED_ASSET_STATUS',
        target: `${asset.tag} to ${status}`,
        entityType: 'Asset',
        entityId: asset._id as unknown as string
      });

      return res.status(200).json(successResponse(`Asset status updated to ${status}`, asset));
    } catch (error) {
      return res.status(500).json(errorResponse('Failed to update asset status'));
    }
  };
}
