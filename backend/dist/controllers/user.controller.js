"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const User_1 = require("../models/User");
const RoleHistory_1 = require("../models/RoleHistory");
const apiResponse_1 = require("../utils/apiResponse");
const zod_1 = require("zod");
const updateUserSchema = zod_1.z.object({
    departmentId: zod_1.z.string().nullable().optional(),
    role: zod_1.z.enum([User_1.UserRole.EMPLOYEE, User_1.UserRole.ASSET_MANAGER, User_1.UserRole.DEPARTMENT_HEAD]),
    status: zod_1.z.enum([User_1.UserStatus.ACTIVE, User_1.UserStatus.INACTIVE]),
});
const updateStatusSchema = zod_1.z.object({
    status: zod_1.z.enum([User_1.UserStatus.ACTIVE, User_1.UserStatus.INACTIVE]),
});
class UserController {
    static async getUsers(req, res, next) {
        try {
            const { search, role, status, departmentId, page = '1', limit = '10' } = req.query;
            const query = {};
            if (search) {
                query.$or = [
                    { firstName: { $regex: search, $options: 'i' } },
                    { lastName: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                    { phone: { $regex: search, $options: 'i' } }
                ];
            }
            if (role)
                query.role = role;
            if (status)
                query.status = status;
            if (departmentId)
                query.departmentId = departmentId;
            const pageNum = parseInt(page, 10);
            const limitNum = parseInt(limit, 10);
            const skip = (pageNum - 1) * limitNum;
            const [users, total] = await Promise.all([
                User_1.User.find(query)
                    .select('-passwordHash -refreshTokenHash')
                    .populate('departmentId', 'name code')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limitNum),
                User_1.User.countDocuments(query)
            ]);
            res.status(200).json((0, apiResponse_1.successResponse)('Users retrieved', {
                users,
                pagination: {
                    total,
                    page: pageNum,
                    limit: limitNum,
                    pages: Math.ceil(total / limitNum)
                }
            }));
        }
        catch (error) {
            next(error);
        }
    }
    static async getUserById(req, res, next) {
        try {
            const user = await User_1.User.findById(req.params.id)
                .select('-passwordHash -refreshTokenHash')
                .populate('departmentId', 'name code status');
            if (!user) {
                return res.status(404).json((0, apiResponse_1.errorResponse)('User not found'));
            }
            res.status(200).json((0, apiResponse_1.successResponse)('User retrieved', user));
        }
        catch (error) {
            next(error);
        }
    }
    static async updateUser(req, res, next) {
        try {
            const { id } = req.params;
            // Prevent updating self for role/status to avoid admin lockout
            if (req.user && req.user._id.toString() === id) {
                return res.status(400).json((0, apiResponse_1.errorResponse)('You cannot update your own role or status here.'));
            }
            const validationResult = updateUserSchema.safeParse(req.body);
            if (!validationResult.success) {
                return res.status(400).json((0, apiResponse_1.errorResponse)('Validation failed', validationResult.error.errors));
            }
            const data = validationResult.data;
            const user = await User_1.User.findById(id);
            if (!user) {
                return res.status(404).json((0, apiResponse_1.errorResponse)('User not found'));
            }
            if (user.role === User_1.UserRole.ADMIN) {
                return res.status(403).json((0, apiResponse_1.errorResponse)('You cannot modify an administrator account.'));
            }
            const oldRole = user.role;
            const newRole = data.role;
            user.departmentId = data.departmentId ? data.departmentId : null;
            user.role = newRole;
            user.status = data.status;
            user.updatedBy = req.user._id;
            await user.save();
            // Log Role History if role changed
            if (oldRole !== newRole) {
                await RoleHistory_1.RoleHistory.create({
                    employeeId: user._id,
                    oldRole,
                    newRole,
                    changedBy: req.user._id
                });
            }
            const updatedUser = await User_1.User.findById(id).select('-passwordHash -refreshTokenHash').populate('departmentId', 'name code');
            res.status(200).json((0, apiResponse_1.successResponse)('User updated successfully', updatedUser));
        }
        catch (error) {
            next(error);
        }
    }
    static async updateUserStatus(req, res, next) {
        try {
            const { id } = req.params;
            if (req.user && req.user._id.toString() === id) {
                return res.status(400).json((0, apiResponse_1.errorResponse)('You cannot update your own status.'));
            }
            const validationResult = updateStatusSchema.safeParse(req.body);
            if (!validationResult.success) {
                return res.status(400).json((0, apiResponse_1.errorResponse)('Validation failed', validationResult.error.errors));
            }
            const user = await User_1.User.findById(id);
            if (!user) {
                return res.status(404).json((0, apiResponse_1.errorResponse)('User not found'));
            }
            user.status = validationResult.data.status;
            user.updatedBy = req.user._id;
            await user.save();
            res.status(200).json((0, apiResponse_1.successResponse)('User status updated successfully', user.status));
        }
        catch (error) {
            next(error);
        }
    }
}
exports.UserController = UserController;
