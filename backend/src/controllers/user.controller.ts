import { Request, Response, NextFunction } from 'express';
import { User, UserRole, UserStatus } from '../models/User';
import { RoleHistory } from '../models/RoleHistory';
import { successResponse, errorResponse } from '../utils/apiResponse';
import { z } from 'zod';

const updateUserSchema = z.object({
  departmentId: z.string().nullable().optional(),
  role: z.enum([UserRole.EMPLOYEE, UserRole.ASSET_MANAGER, UserRole.DEPARTMENT_HEAD]),
  status: z.enum([UserStatus.ACTIVE, UserStatus.INACTIVE]),
});

const updateStatusSchema = z.object({
  status: z.enum([UserStatus.ACTIVE, UserStatus.INACTIVE]),
});

export class UserController {
  static async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, role, status, departmentId, page = '1', limit = '10' } = req.query;
      
      const query: any = {};
      
      if (search) {
        query.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ];
      }

      if (role) query.role = role;
      if (status) query.status = status;
      if (departmentId) query.departmentId = departmentId;

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const skip = (pageNum - 1) * limitNum;

      const [users, total] = await Promise.all([
        User.find(query)
          .select('-passwordHash -refreshTokenHash')
          .populate('departmentId', 'name code')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum),
        User.countDocuments(query)
      ]);

      res.status(200).json(successResponse('Users retrieved', {
        users,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum)
        }
      }));
    } catch (error) {
      next(error);
    }
  }

  static async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await User.findById(req.params.id)
        .select('-passwordHash -refreshTokenHash')
        .populate('departmentId', 'name code status');
        
      if (!user) {
        return res.status(404).json(errorResponse('User not found'));
      }

      res.status(200).json(successResponse('User retrieved', user));
    } catch (error) {
      next(error);
    }
  }

  static async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      // Prevent updating self for role/status to avoid admin lockout
      if (req.user && req.user._id.toString() === id) {
         return res.status(400).json(errorResponse('You cannot update your own role or status here.'));
      }

      const validationResult = updateUserSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json(errorResponse('Validation failed', (validationResult.error as any).errors || []));
      }

      const data = validationResult.data;
      const user = await User.findById(id);

      if (!user) {
        return res.status(404).json(errorResponse('User not found'));
      }

      if (user.role === UserRole.ADMIN) {
        return res.status(403).json(errorResponse('You cannot modify an administrator account.'));
      }

      const oldRole = user.role;
      const newRole = data.role;

      user.departmentId = data.departmentId ? data.departmentId as any : null;
      user.role = newRole as UserRole;
      user.status = data.status as UserStatus;
      user.updatedBy = req.user!._id as any;

      await user.save();

      // Log Role History if role changed
      if (oldRole !== newRole) {
        await RoleHistory.create({
          employeeId: user._id,
          oldRole,
          newRole,
          changedBy: req.user!._id
        });
      }

      const updatedUser = await User.findById(id).select('-passwordHash -refreshTokenHash').populate('departmentId', 'name code');
      res.status(200).json(successResponse('User updated successfully', updatedUser));
    } catch (error) {
      next(error);
    }
  }

  static async updateUserStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (req.user && req.user._id.toString() === id) {
         return res.status(400).json(errorResponse('You cannot update your own status.'));
      }

      const validationResult = updateStatusSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json(errorResponse('Validation failed', (validationResult.error as any).errors || []));
      }

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json(errorResponse('User not found'));
      }

      user.status = validationResult.data.status as UserStatus;
      user.updatedBy = req.user!._id as any;
      await user.save();

      res.status(200).json(successResponse('User status updated successfully', user.status));
    } catch (error) {
      next(error);
    }
  }
}
