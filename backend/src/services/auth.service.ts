import { User, IUser, UserRole } from '../models/User';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export class AuthService {
  static async signup(data: any): Promise<{ user: Partial<IUser>; accessToken: string; refreshToken: string }> {
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      throw new Error('Email already in use');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    
    // Force role to EMPLOYEE regardless of what client sends
    const user = await User.create({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      passwordHash,
      phone: data.phone,
      role: UserRole.EMPLOYEE,
    });

    const tokens = this.generateTokens(user as IUser);
    await this.updateRefreshToken(user, tokens.refreshToken);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  static async login(data: any): Promise<{ user: Partial<IUser>; accessToken: string; refreshToken: string }> {
    const user = await User.findOne({ email: data.email });
    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (user.status !== 'ACTIVE') {
      throw new Error('User account is inactive');
    }

    const isMatch = await bcrypt.compare(data.password, user.passwordHash);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    user.lastLogin = new Date();
    await user.save();

    const tokens = this.generateTokens(user as IUser);
    await this.updateRefreshToken(user, tokens.refreshToken);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  static async refresh(refreshToken: string): Promise<{ accessToken: string; newRefreshToken: string }> {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'refresh_secret') as any;
      const user = await User.findById(decoded.id);

      if (!user || user.status !== 'ACTIVE') {
        throw new Error('Invalid or inactive user');
      }

      if (!user.refreshTokenHash) {
        throw new Error('Invalid refresh token');
      }

      const isMatch = await bcrypt.compare(refreshToken, user.refreshTokenHash);
      if (!isMatch) {
        throw new Error('Invalid refresh token');
      }

      const tokens = this.generateTokens(user as IUser);
      await this.updateRefreshToken(user, tokens.refreshToken);

      return {
        accessToken: tokens.accessToken,
        newRefreshToken: tokens.refreshToken,
      };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  static async logout(userId: string): Promise<void> {
    const user = await User.findById(userId);
    if (user) {
      user.refreshTokenHash = undefined;
      await user.save();
    }
  }

  static async forgotPassword(email: string): Promise<string> {
    const user = await User.findOne({ email });
    if (!user) {
      // Return dummy token to avoid email enumeration
      return crypto.randomBytes(20).toString('hex'); 
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 mins
    await user.save();

    return resetToken;
  }

  static async resetPassword(resetToken: string, newPassword: string): Promise<void> {
    const resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      throw new Error('Invalid or expired reset token');
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
  }

  private static generateTokens(user: IUser) {
    const accessToken = jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_ACCESS_SECRET || 'secret', {
      expiresIn: '15m',
    });
    const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET || 'refresh_secret', {
      expiresIn: '7d',
    });
    return { accessToken, refreshToken };
  }

  private static async updateRefreshToken(user: IUser, refreshToken: string) {
    user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await user.save();
  }

  static sanitizeUser(user: IUser): Partial<IUser> {
    const obj = user.toObject();
    delete obj.passwordHash;
    delete obj.refreshTokenHash;
    delete obj.resetPasswordToken;
    delete obj.resetPasswordExpires;
    return obj;
  }
}
