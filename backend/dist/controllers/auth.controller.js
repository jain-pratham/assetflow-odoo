"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("../services/auth.service");
const apiResponse_1 = require("../utils/apiResponse");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class AuthController {
    static async signup(req, res, next) {
        try {
            const { user, accessToken, refreshToken } = await auth_service_1.AuthService.signup(req.body);
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            });
            res.status(201).json((0, apiResponse_1.successResponse)('User created successfully', { user, accessToken }));
        }
        catch (error) {
            next(error);
        }
    }
    static async login(req, res, next) {
        try {
            const { user, accessToken, refreshToken } = await auth_service_1.AuthService.login(req.body);
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            });
            res.status(200).json((0, apiResponse_1.successResponse)('Login successful', { user, accessToken }));
        }
        catch (error) {
            next(error);
        }
    }
    static async refresh(req, res, next) {
        try {
            const refreshToken = req.cookies.refreshToken;
            if (!refreshToken) {
                return res.status(401).json((0, apiResponse_1.errorResponse)('Refresh token not found'));
            }
            const { accessToken, newRefreshToken } = await auth_service_1.AuthService.refresh(refreshToken);
            res.cookie('refreshToken', newRefreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });
            res.status(200).json((0, apiResponse_1.successResponse)('Token refreshed', { accessToken }));
        }
        catch (error) {
            next(error);
        }
    }
    static async logout(req, res, next) {
        try {
            let userId = req.user?._id?.toString();
            if (!userId && req.cookies.refreshToken) {
                try {
                    const decoded = jsonwebtoken_1.default.verify(req.cookies.refreshToken, process.env.JWT_REFRESH_SECRET || 'refresh_secret');
                    userId = decoded.id;
                }
                catch (e) {
                    // Ignore invalid token
                }
            }
            if (userId) {
                await auth_service_1.AuthService.logout(userId);
            }
            res.clearCookie('refreshToken');
            res.status(200).json((0, apiResponse_1.successResponse)('Logged out successfully'));
        }
        catch (error) {
            next(error);
        }
    }
    static async forgotPassword(req, res, next) {
        try {
            const token = await auth_service_1.AuthService.forgotPassword(req.body.email);
            // In a real app, send an email here.
            console.log(`[MOCK EMAIL] Reset link: ${process.env.FRONTEND_URL}/reset-password?token=${token}`);
            res.status(200).json((0, apiResponse_1.successResponse)('If the email is registered, a reset link will be sent.'));
        }
        catch (error) {
            next(error);
        }
    }
    static async resetPassword(req, res, next) {
        try {
            const { resetToken } = req.params;
            const { password } = req.body;
            await auth_service_1.AuthService.resetPassword(resetToken, password);
            res.status(200).json((0, apiResponse_1.successResponse)('Password has been reset successfully.'));
        }
        catch (error) {
            next(error);
        }
    }
    static async getMe(req, res, next) {
        try {
            if (!req.user) {
                return res.status(401).json((0, apiResponse_1.errorResponse)('Not authorized'));
            }
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
            res.status(200).json((0, apiResponse_1.successResponse)('User profile fetched', auth_service_1.AuthService.sanitizeUser(req.user)));
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AuthController = AuthController;
