import { Request, Response, NextFunction } from 'express';
import { Department } from '../models/Department';
import { User } from '../models/User';
import { successResponse, errorResponse } from '../utils/apiResponse';
import { createDepartmentSchema, updateDepartmentSchema } from '../validators/department.validator';

export class DepartmentController {
  static async getDepartments(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string);
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      const status = req.query.status as string;

      const query: any = {};
      
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { code: { $regex: search, $options: 'i' } },
        ];
      }
      
      if (status) {
        query.status = status;
      }

      // If page is provided, do paginated response
      if (!isNaN(page)) {
        const skip = (page - 1) * limit;
        
        // Use aggregation to get employee counts efficiently
        const departments = await Department.aggregate([
          { $match: query },
          { $sort: { createdAt: -1 } },
          { $skip: skip },
          { $limit: limit },
          {
            $lookup: {
              from: 'users',
              localField: 'headId',
              foreignField: '_id',
              as: 'head'
            }
          },
          {
            $unwind: {
              path: '$head',
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $lookup: {
              from: 'users',
              let: { deptId: '$_id' },
              pipeline: [
                { $match: { $expr: { $eq: ['$departmentId', '$$deptId'] } } },
                { $count: 'count' }
              ],
              as: 'employeeCountData'
            }
          },
          {
            $addFields: {
              employeeCount: {
                $ifNull: [{ $arrayElemAt: ['$employeeCountData.count', 0] }, 0]
              }
            }
          },
          { $project: { employeeCountData: 0, 'head.passwordHash': 0, 'head.refreshTokenHash': 0 } }
        ]);

        const total = await Department.countDocuments(query);

        return res.status(200).json(successResponse('Departments retrieved', {
          departments,
          pagination: {
            total,
            page,
            pages: Math.ceil(total / limit)
          }
        }));
      }

      // Fallback: Legacy flat array return (For Employee Module Dropdowns)
      // Enforce ACTIVE only if not specified
      if (!req.query.status) query.status = 'ACTIVE';
      const departments = await Department.find(query).sort({ name: 1 });
      return res.status(200).json(successResponse('Departments retrieved', departments));
    } catch (error) {
      next(error);
    }
  }

  static async getDepartmentById(req: Request, res: Response, next: NextFunction) {
    try {
      const department = await Department.findById(req.params.id).populate('headId', '-passwordHash -refreshTokenHash');
      if (!department) {
        return res.status(404).json(errorResponse('Department not found'));
      }
      
      const employeeCount = await User.countDocuments({ departmentId: department._id });
      
      res.status(200).json(successResponse('Department retrieved', {
        ...department.toObject(),
        employeeCount
      }));
    } catch (error) {
      next(error);
    }
  }

  static async createDepartment(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = createDepartmentSchema.parse(req.body);

      const existingCode = await Department.findOne({ code: validatedData.code });
      if (existingCode) {
        return res.status(409).json(errorResponse('Department code already exists'));
      }

      const existingName = await Department.findOne({ name: validatedData.name });
      if (existingName) {
        return res.status(409).json(errorResponse('Department name already exists'));
      }

      const department = await Department.create(validatedData);
      res.status(201).json(successResponse('Department created successfully', department));
    } catch (error: any) {
      if (error.errors) {
        return res.status(400).json(errorResponse(error.errors[0]?.message || 'Validation error'));
      }
      next(error);
    }
  }

  static async updateDepartment(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = updateDepartmentSchema.parse(req.body);

      if (validatedData.code) {
        const existingCode = await Department.findOne({ code: validatedData.code, _id: { $ne: req.params.id } });
        if (existingCode) {
          return res.status(409).json(errorResponse('Department code already exists'));
        }
      }

      if (validatedData.name) {
        const existingName = await Department.findOne({ name: validatedData.name, _id: { $ne: req.params.id } });
        if (existingName) {
          return res.status(409).json(errorResponse('Department name already exists'));
        }
      }

      const department = await Department.findByIdAndUpdate(req.params.id, validatedData, { new: true });
      if (!department) {
        return res.status(404).json(errorResponse('Department not found'));
      }

      res.status(200).json(successResponse('Department updated successfully', department));
    } catch (error: any) {
      if (error.errors) {
        return res.status(400).json(errorResponse(error.errors[0]?.message || 'Validation error'));
      }
      next(error);
    }
  }

  static async toggleDepartmentStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { status } = req.body;
      if (!['ACTIVE', 'INACTIVE'].includes(status)) {
        return res.status(400).json(errorResponse('Invalid status'));
      }

      const department = await Department.findById(req.params.id);
      if (!department) {
        return res.status(404).json(errorResponse('Department not found'));
      }

      // If deactivating, ensure no active employees are assigned
      if (status === 'INACTIVE') {
        const activeUsersCount = await User.countDocuments({ 
          departmentId: department._id, 
          status: 'ACTIVE' 
        });
        
        if (activeUsersCount > 0) {
          return res.status(400).json(errorResponse(`Cannot deactivate department. There are ${activeUsersCount} active employees assigned to it. Please reassign them first.`));
        }
      }

      department.status = status;
      await department.save();

      res.status(200).json(successResponse(`Department marked as ${status}`, department));
    } catch (error) {
      next(error);
    }
  }
}
