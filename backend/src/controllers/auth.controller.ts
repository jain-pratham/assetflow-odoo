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
      
      if (token) {
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
        
        const html = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: 'Inter', 'Segoe UI', sans-serif; background-color: #f3f4f6; padding: 20px; color: #111827; }
              .container { max-w-2xl; margin: 0 auto; background: #ffffff; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
              .header { text-align: center; margin-bottom: 30px; }
              .logo { width: 48px; height: 48px; background: #2563eb; color: white; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; font-weight: bold; font-size: 24px; margin-bottom: 10px; }
              .title { font-size: 24px; font-weight: 700; color: #111827; margin: 0; }
              .btn { display: inline-block; background: #2563eb; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; margin: 20px 0; }
              .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; text-align: center; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">AF</div>
                <h1 class="title">AssetFlow ERP</h1>
              </div>
              <p>Hello,</p>
              <p>We received a request to reset your password for your AssetFlow ERP account. If you made this request, please click the button below to choose a new password:</p>
              <div style="text-align: center;">
                <a href="${resetUrl}" class="btn">Reset Password</a>
              </div>
              <p style="color: #4b5563; font-size: 14px; margin-top: 20px;">
                <strong>Note:</strong> This link will expire in <strong>15 minutes</strong> for security reasons.
              </p>
              <p>If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
              <div class="footer">
                <p>Need help? Contact our support team at support@assetflow.com</p>
                <p>&copy; ${new Date().getFullYear()} AssetFlow ERP. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `;
        
        MailService.sendEmail(req.body.email, 'AssetFlow Password Reset Request', html);
      }
      
      // ALWAYS return generic success
      res.status(200).json(successResponse('If the email is registered, a reset link will be sent.'));
    } catch (error) {
      next(error);
    }
  }

  static async verifyResetToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { resetToken } = req.query;
      if (!resetToken || typeof resetToken !== 'string') {
        return res.status(400).json(errorResponse('Token is required'));
      }
      
      const isValid = await AuthService.verifyResetToken(resetToken);
      if (!isValid) {
        return res.status(400).json(errorResponse('Invalid or expired reset token'));
      }
      
      res.status(200).json(successResponse('Token is valid'));
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
