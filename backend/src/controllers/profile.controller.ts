import { Request, Response, NextFunction } from 'express';
import { ProfileService } from '../services/profile.service';
import { successResponse } from '../utils/apiResponse';

export class ProfileController {
  static getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profile = await ProfileService.getProfile(req.user!._id.toString());
      res.status(200).json(successResponse('Profile fetched', profile));
    } catch (error) {
      next(error);
    }
  };

  static updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updatedProfile = await ProfileService.updateProfile(req.user!._id.toString(), req.body);
      res.status(200).json(successResponse('Profile updated successfully', updatedProfile));
    } catch (error) {
      next(error);
    }
  };

  static updatePassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { currentPassword, newPassword } = req.body;
      await ProfileService.updatePassword(req.user!._id.toString(), currentPassword, newPassword);
      
      // Clear refresh token cookie since the user must login again
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });
      
      res.status(200).json(successResponse('Password changed successfully. Please login again.'));
    } catch (error) {
      next(error);
    }
  };

  static updateAvatar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw new Error('No file uploaded or invalid file format');
      }
      
      // File is successfully uploaded by multer to public/uploads/avatars
      // Generate relative URL
      const relativePath = `/uploads/avatars/${req.file.filename}`;
      
      const updatedProfile = await ProfileService.updateAvatar(req.user!._id.toString(), relativePath);
      res.status(200).json(successResponse('Avatar updated successfully', updatedProfile));
    } catch (error) {
      next(error);
    }
  };

  static removeAvatar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updatedProfile = await ProfileService.removeAvatar(req.user!._id.toString());
      res.status(200).json(successResponse('Avatar removed successfully', updatedProfile));
    } catch (error) {
      next(error);
    }
  };

  static getActivity = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const result = await ProfileService.getActivity(req.user!._id.toString(), page, limit);
      res.status(200).json(successResponse('Activity fetched', result.data, {
        total: result.total,
        page,
        pages: Math.ceil(result.total / limit) || 1
      }));
    } catch (error) {
      next(error);
    }
  };
}
