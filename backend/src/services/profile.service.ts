import { User, IUser } from '../models/User';
import { ActivityLog } from '../models/ActivityLog';
import { NotificationService } from './notification.service';
import { MailService } from './mail.service';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';

export class ProfileService {
  static async getProfile(userId: string) {
    const user = await User.findById(userId).populate('departmentId', 'name description');
    if (!user) throw new Error('User not found');
    
    const obj = user.toObject();
    delete obj.passwordHash;
    delete obj.refreshTokenHash;
    delete obj.resetPasswordToken;
    delete obj.resetPasswordExpires;
    
    return obj;
  }

  static async updateProfile(userId: string, data: any) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    if (data.firstName) user.firstName = data.firstName;
    if (data.lastName) user.lastName = data.lastName;
    if (data.phone !== undefined) user.phone = data.phone;
    
    // If email is being changed, ensure it's not taken
    if (data.email && data.email !== user.email) {
      const existing = await User.findOne({ email: data.email });
      if (existing) throw new Error('Email is already taken');
      user.email = data.email;
    }

    await user.save();
    
    await NotificationService.logActivity(
      userId,
      'UPDATE',
      'USER',
      userId,
      'Updated profile information'
    );
    
    await NotificationService.createNotification(
      userId,
      'Profile Updated',
      'Your profile information has been updated successfully.',
      'SYSTEM',
      'LOW'
    );

    return this.getProfile(userId);
  }

  static async updatePassword(userId: string, currentPassword?: string, newPassword?: string) {
    if (!currentPassword || !newPassword) {
      throw new Error('Current password and new password are required');
    }

    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new Error('Wrong current password');
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    // Logout from all sessions by destroying refresh token
    user.refreshTokenHash = undefined;
    await user.save();

    await NotificationService.logActivity(
      userId,
      'UPDATE',
      'USER',
      userId,
      'Changed account password'
    );
    
    await NotificationService.createNotification(
      userId,
      'Password Changed',
      'Your password was changed successfully. If this was not you, please contact support immediately.',
      'SECURITY',
      'HIGH'
    );

    // Send Email
    const html = `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2>Password Changed</h2>
        <p>Your password for AssetFlow was recently changed.</p>
        <p>If you did not make this change, please contact your administrator immediately.</p>
      </div>
    `;
    MailService.sendEmail(user.email, '[AssetFlow] Password Changed', html);
  }

  static async updateAvatar(userId: string, relativePath: string) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    // Remove old avatar file if it exists and is local
    if (user.avatar && user.avatar.startsWith('/uploads/avatars/')) {
      const oldPath = path.join(process.cwd(), 'public', user.avatar);
      if (fs.existsSync(oldPath)) {
        try {
          fs.unlinkSync(oldPath);
        } catch (e) {
          console.error('Failed to remove old avatar:', e);
        }
      }
    }

    user.avatar = relativePath;
    await user.save();

    await NotificationService.logActivity(
      userId,
      'UPDATE',
      'USER',
      userId,
      'Updated profile avatar'
    );
    
    await NotificationService.createNotification(
      userId,
      'Avatar Updated',
      'Your profile picture was successfully updated.',
      'SYSTEM',
      'LOW'
    );

    return this.getProfile(userId);
  }

  static async removeAvatar(userId: string) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    if (user.avatar && user.avatar.startsWith('/uploads/avatars/')) {
      const oldPath = path.join(process.cwd(), 'public', user.avatar);
      if (fs.existsSync(oldPath)) {
        try {
          fs.unlinkSync(oldPath);
        } catch (e) {
          console.error('Failed to remove old avatar:', e);
        }
      }
    }

    user.avatar = '';
    await user.save();

    await NotificationService.logActivity(
      userId,
      'UPDATE',
      'USER',
      userId,
      'Removed profile avatar'
    );

    return this.getProfile(userId);
  }

  static async getActivity(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    
    const query = { actor: userId };
    
    const total = await ActivityLog.countDocuments(query);
    const data = await ActivityLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('actor', 'firstName lastName avatar')
      .lean();
      
    return { data, total };
  }
}
