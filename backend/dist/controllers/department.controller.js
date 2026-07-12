"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DepartmentController = void 0;
const Department_1 = require("../models/Department");
const User_1 = require("../models/User");
const apiResponse_1 = require("../utils/apiResponse");
const department_validator_1 = require("../validators/department.validator");
class DepartmentController {
    static async getDepartments(req, res, next) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || (req.query.page ? 10 : 1000);
            const search = req.query.search;
            const status = req.query.status;
            const query = {};
            if (search) {
                query.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { code: { $regex: search, $options: 'i' } },
                ];
            }
            if (status) {
                query.status = status;
            }
            else if (!req.query.page && !req.query.limit) {
                // Legacy support: if neither page nor limit is provided, assume it's for a dropdown and only want ACTIVE
                query.status = 'ACTIVE';
            }
            const skip = (page - 1) * limit;
            // Use aggregation to get employee counts efficiently
            const departments = await Department_1.Department.aggregate([
                { $match: query },
                { $sort: { name: 1 } },
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
            const total = await Department_1.Department.countDocuments(query);
            return res.status(200).json((0, apiResponse_1.successResponse)('Departments retrieved', departments, {
                total,
                page,
                pages: Math.ceil(total / limit) || 1
            }));
        }
        catch (error) {
            next(error);
        }
    }
    static async getDepartmentById(req, res, next) {
        try {
            const department = await Department_1.Department.findById(req.params.id).populate('headId', '-passwordHash -refreshTokenHash');
            if (!department) {
                return res.status(404).json((0, apiResponse_1.errorResponse)('Department not found'));
            }
            const employeeCount = await User_1.User.countDocuments({ departmentId: department._id });
            res.status(200).json((0, apiResponse_1.successResponse)('Department retrieved', {
                ...department.toObject(),
                employeeCount
            }));
        }
        catch (error) {
            next(error);
        }
    }
    static async createDepartment(req, res, next) {
        try {
            const validatedData = department_validator_1.createDepartmentSchema.parse(req.body);
            const existingCode = await Department_1.Department.findOne({ code: validatedData.code });
            if (existingCode) {
                return res.status(409).json((0, apiResponse_1.errorResponse)('Department code already exists'));
            }
            const existingName = await Department_1.Department.findOne({ name: validatedData.name });
            if (existingName) {
                return res.status(409).json((0, apiResponse_1.errorResponse)('Department name already exists'));
            }
            const department = await Department_1.Department.create(validatedData);
            res.status(201).json((0, apiResponse_1.successResponse)('Department created successfully', department));
        }
        catch (error) {
            if (error.errors) {
                return res.status(400).json((0, apiResponse_1.errorResponse)(error.errors[0]?.message || 'Validation error'));
            }
            next(error);
        }
    }
    static async updateDepartment(req, res, next) {
        try {
            const validatedData = department_validator_1.updateDepartmentSchema.parse(req.body);
            if (validatedData.code) {
                const existingCode = await Department_1.Department.findOne({ code: validatedData.code, _id: { $ne: req.params.id } });
                if (existingCode) {
                    return res.status(409).json((0, apiResponse_1.errorResponse)('Department code already exists'));
                }
            }
            if (validatedData.name) {
                const existingName = await Department_1.Department.findOne({ name: validatedData.name, _id: { $ne: req.params.id } });
                if (existingName) {
                    return res.status(409).json((0, apiResponse_1.errorResponse)('Department name already exists'));
                }
            }
            const department = await Department_1.Department.findByIdAndUpdate(req.params.id, validatedData, { new: true });
            if (!department) {
                return res.status(404).json((0, apiResponse_1.errorResponse)('Department not found'));
            }
            res.status(200).json((0, apiResponse_1.successResponse)('Department updated successfully', department));
        }
        catch (error) {
            if (error.errors) {
                return res.status(400).json((0, apiResponse_1.errorResponse)(error.errors[0]?.message || 'Validation error'));
            }
            next(error);
        }
    }
    static async toggleDepartmentStatus(req, res, next) {
        try {
            const { status } = req.body;
            if (!['ACTIVE', 'INACTIVE'].includes(status)) {
                return res.status(400).json((0, apiResponse_1.errorResponse)('Invalid status'));
            }
            const department = await Department_1.Department.findById(req.params.id);
            if (!department) {
                return res.status(404).json((0, apiResponse_1.errorResponse)('Department not found'));
            }
            // If deactivating, ensure no active employees are assigned
            if (status === 'INACTIVE') {
                const activeUsersCount = await User_1.User.countDocuments({
                    departmentId: department._id,
                    status: 'ACTIVE'
                });
                if (activeUsersCount > 0) {
                    return res.status(400).json((0, apiResponse_1.errorResponse)(`Cannot deactivate department. There are ${activeUsersCount} active employees assigned to it. Please reassign them first.`));
                }
            }
            department.status = status;
            await department.save();
            res.status(200).json((0, apiResponse_1.successResponse)(`Department marked as ${status}`, department));
        }
        catch (error) {
            next(error);
        }
    }
}
exports.DepartmentController = DepartmentController;
