"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const User_1 = require("../models/User");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
class AuthService {
    static async signup(data) {
        const existingUser = await User_1.User.findOne({ email: data.email });
        if (existingUser) {
            throw new Error('Email already in use');
        }
        const passwordHash = await bcrypt_1.default.hash(data.password, 10);
        // Force role to EMPLOYEE regardless of what client sends
        const user = await User_1.User.create({
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            passwordHash,
            phone: data.phone,
            role: User_1.UserRole.EMPLOYEE,
        });
        const tokens = this.generateTokens(user);
        await this.updateRefreshToken(user, tokens.refreshToken);
        return {
            user: this.sanitizeUser(user),
            ...tokens,
        };
    }
    static async login(data) {
        const user = await User_1.User.findOne({ email: data.email });
        if (!user) {
            throw new Error('Invalid credentials');
        }
        if (user.status !== 'ACTIVE') {
            throw new Error('User account is inactive');
        }
        const isMatch = await bcrypt_1.default.compare(data.password, user.passwordHash);
        if (!isMatch) {
            throw new Error('Invalid credentials');
        }
        user.lastLogin = new Date();
        await user.save();
        const tokens = this.generateTokens(user);
        await this.updateRefreshToken(user, tokens.refreshToken);
        return {
            user: this.sanitizeUser(user),
            ...tokens,
        };
    }
    static async refresh(refreshToken) {
        try {
            const decoded = jsonwebtoken_1.default.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'refresh_secret');
            const user = await User_1.User.findById(decoded.id);
            if (!user || user.status !== 'ACTIVE') {
                throw new Error('Invalid or inactive user');
            }
            if (!user.refreshTokenHash) {
                throw new Error('Invalid refresh token');
            }
            const isMatch = await bcrypt_1.default.compare(refreshToken, user.refreshTokenHash);
            if (!isMatch) {
                throw new Error('Invalid refresh token');
            }
            const tokens = this.generateTokens(user);
            await this.updateRefreshToken(user, tokens.refreshToken);
            return {
                accessToken: tokens.accessToken,
                newRefreshToken: tokens.refreshToken,
            };
        }
        catch (error) {
            throw new Error('Invalid refresh token');
        }
    }
    static async logout(userId) {
        const user = await User_1.User.findById(userId);
        if (user) {
            user.refreshTokenHash = undefined;
            await user.save();
        }
    }
    static async forgotPassword(email) {
        const user = await User_1.User.findOne({ email });
        if (!user) {
            // Return dummy token to avoid email enumeration
            return crypto_1.default.randomBytes(20).toString('hex');
        }
        const resetToken = crypto_1.default.randomBytes(20).toString('hex');
        user.resetPasswordToken = crypto_1.default.createHash('sha256').update(resetToken).digest('hex');
        user.resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 mins
        await user.save();
        return resetToken;
    }
    static async resetPassword(resetToken, newPassword) {
        const resetPasswordToken = crypto_1.default.createHash('sha256').update(resetToken).digest('hex');
        const user = await User_1.User.findOne({
            resetPasswordToken,
            resetPasswordExpires: { $gt: Date.now() },
        });
        if (!user) {
            throw new Error('Invalid or expired reset token');
        }
        user.passwordHash = await bcrypt_1.default.hash(newPassword, 10);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
    }
    static generateTokens(user) {
        const accessToken = jsonwebtoken_1.default.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_ACCESS_SECRET || 'secret', {
            expiresIn: '15m',
        });
        const refreshToken = jsonwebtoken_1.default.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET || 'refresh_secret', {
            expiresIn: '7d',
        });
        return { accessToken, refreshToken };
    }
    static async updateRefreshToken(user, refreshToken) {
        user.refreshTokenHash = await bcrypt_1.default.hash(refreshToken, 10);
        await user.save();
    }
    static sanitizeUser(user) {
        const obj = user.toObject();
        delete obj.passwordHash;
        delete obj.refreshTokenHash;
        delete obj.resetPasswordToken;
        delete obj.resetPasswordExpires;
        return obj;
    }
}
exports.AuthService = AuthService;
