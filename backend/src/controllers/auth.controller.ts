import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { successResponse, errorResponse } from '../utils/apiResponse';
import jwt from 'jsonwebtoken';
import { NotificationService } from '../services/notification.service';
import { MailService } from '../services/mail.service';

export class AuthController {
  static async signup(req: Request, res: Response, next: NextFunction) {
    try {
      const { user, accessToken, refreshToken } = await AuthService.signup(req.body);
      
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      await NotificationService.createNotification({
        title: 'Welcome to AssetFlow',
        message: 'Your account has been created successfully. Welcome aboard!',
        type: 'USER',
        recipient: user._id as unknown as string,
        actionUrl: '/profile'
      });

      res.status(201).json(successResponse('User created successfully', { user, accessToken }));
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { user, accessToken, refreshToken } = await AuthService.login(req.body);

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(200).json(successResponse('Login successful', { user, accessToken }));
    } catch (error) {
      next(error);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) {
        return res.status(401).json(errorResponse('Refresh token not found'));
      }

      const { accessToken, newRefreshToken } = await AuthService.refresh(refreshToken);

      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json(successResponse('Token refreshed', { accessToken }));
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      let userId = req.user?._id?.toString();
      
      if (!userId && req.cookies.refreshToken) {
        try {
          const decoded = jwt.verify(req.cookies.refreshToken, process.env.JWT_REFRESH_SECRET || 'refresh_secret') as any;
          userId = decoded.id;
        } catch (e) {
          // Ignore invalid token
        }
      }

      if (userId) {
        await AuthService.logout(userId);
      }
      
      res.clearCookie('refreshToken');
      res.status(200).json(successResponse('Logged out successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const token = await AuthService.forgotPassword(req.body.email);
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
      const html = `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Password Reset Request</h2>
          <p>You requested a password reset. Click the button below to reset your password.</p>
          <a href="${resetUrl}" style="display:inline-block; padding: 10px 15px; background: #3b82f6; color: #fff; text-decoration: none; border-radius: 5px;">Reset Password</a>
          <p>If you did not request this, please ignore this email.</p>
        </div>
      `;
      MailService.sendEmail(req.body.email, '[AssetFlow] Password Reset', html);
      
      res.status(200).json(successResponse('If the email is registered, a reset link will be sent.'));
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { resetToken } = req.params;
      const { password } = req.body;
      
      await AuthService.resetPassword(resetToken as string, password);
      res.status(200).json(successResponse('Password has been reset successfully.'));
    } catch (error) {
      next(error);
    }
  }

  static async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json(errorResponse('Not authorized'));
      }
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.status(200).json(successResponse('User profile fetched', AuthService.sanitizeUser(req.user)));
    } catch (error) {
      next(error);
    }
  }
}
