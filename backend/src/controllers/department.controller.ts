import { Request, Response, NextFunction } from 'express';
import { Department } from '../models/Department';
import { successResponse, errorResponse } from '../utils/apiResponse';

export class DepartmentController {
  static async getDepartments(req: Request, res: Response, next: NextFunction) {
    try {
      const departments = await Department.find({ status: 'ACTIVE' }).sort({ name: 1 });
      res.status(200).json(successResponse('Departments retrieved', departments));
    } catch (error) {
      next(error);
    }
  }
}
