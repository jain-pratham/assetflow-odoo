"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssetController = void 0;
const Asset_1 = __importDefault(require("../models/Asset"));
const asset_validator_1 = require("../validators/asset.validator");
const apiResponse_1 = require("../utils/apiResponse");
const User_1 = require("../models/User");
class AssetController {
    /**
     * Helper to build the RBAC base query for Assets
     */
    static getRbacQuery(user) {
        const role = user.role;
        if (role === User_1.UserRole.ADMIN || role === User_1.UserRole.ASSET_MANAGER) {
            return {}; // Full access
        }
        if (role === User_1.UserRole.DEPARTMENT_HEAD) {
            return { department: user.departmentId };
        }
        // EMPLOYEE
        return { assignedTo: user._id };
    }
    static getAssetStats = async (req, res) => {
        try {
            const baseQuery = AssetController.getRbacQuery(req.user);
            const [total, available, allocated, maintenance, retired] = await Promise.all([
                Asset_1.default.countDocuments(baseQuery),
                Asset_1.default.countDocuments({ ...baseQuery, status: 'AVAILABLE' }),
                Asset_1.default.countDocuments({ ...baseQuery, status: 'ALLOCATED' }),
                Asset_1.default.countDocuments({ ...baseQuery, status: 'MAINTENANCE' }),
                Asset_1.default.countDocuments({ ...baseQuery, status: 'RETIRED' }),
            ]);
            return res.status(200).json((0, apiResponse_1.successResponse)('Asset stats retrieved', {
                total, available, allocated, maintenance, retired
            }));
        }
        catch (error) {
            console.error('Get asset stats error:', error);
            return res.status(500).json((0, apiResponse_1.errorResponse)('Failed to fetch asset stats'));
        }
    };
    static getAssets = async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;
            const query = AssetController.getRbacQuery(req.user);
            if (req.query.search) {
                query.$or = [
                    { name: { $regex: req.query.search, $options: 'i' } },
                    { tag: { $regex: req.query.search, $options: 'i' } },
                    { serialNumber: { $regex: req.query.search, $options: 'i' } }
                ];
            }
            if (req.query.status)
                query.status = req.query.status;
            if (req.query.category)
                query.category = req.query.category;
            if (req.query.department)
                query.department = req.query.department;
            if (req.query.assignedTo)
                query.assignedTo = req.query.assignedTo;
            const total = await Asset_1.default.countDocuments(query);
            const assets = await Asset_1.default.find(query)
                .populate('category', 'name code')
                .populate('department', 'name code')
                .populate('assignedTo', 'firstName lastName email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean();
            return res.status(200).json((0, apiResponse_1.successResponse)('Assets retrieved', assets, {
                total, page, pages: Math.ceil(total / limit) || 1
            }));
        }
        catch (error) {
            console.error('Get assets error:', error);
            return res.status(500).json((0, apiResponse_1.errorResponse)('Failed to fetch assets'));
        }
    };
    static getAssetById = async (req, res) => {
        try {
            const query = { _id: req.params.id, ...AssetController.getRbacQuery(req.user) };
            const asset = await Asset_1.default.findOne(query)
                .populate('category', 'name code')
                .populate('department', 'name code')
                .populate('assignedTo', 'firstName lastName email')
                .lean();
            if (!asset)
                return res.status(404).json((0, apiResponse_1.errorResponse)('Asset not found or access denied'));
            return res.status(200).json((0, apiResponse_1.successResponse)('Asset retrieved', asset));
        }
        catch (error) {
            return res.status(500).json((0, apiResponse_1.errorResponse)('Failed to fetch asset'));
        }
    };
    static createAsset = async (req, res) => {
        try {
            const validatedData = asset_validator_1.createAssetSchema.parse(req.body);
            const existingTag = await Asset_1.default.findOne({ tag: validatedData.tag });
            if (existingTag)
                return res.status(409).json((0, apiResponse_1.errorResponse)('Asset tag already exists'));
            const asset = await Asset_1.default.create(validatedData);
            return res.status(201).json((0, apiResponse_1.successResponse)('Asset created successfully', asset));
        }
        catch (error) {
            if (error.name === 'ZodError')
                return res.status(400).json((0, apiResponse_1.errorResponse)(error.errors[0].message));
            return res.status(500).json((0, apiResponse_1.errorResponse)('Failed to create asset'));
        }
    };
    static updateAsset = async (req, res) => {
        try {
            const validatedData = asset_validator_1.updateAssetSchema.parse(req.body);
            const asset = await Asset_1.default.findById(req.params.id);
            if (!asset)
                return res.status(404).json((0, apiResponse_1.errorResponse)('Asset not found'));
            if (validatedData.tag && validatedData.tag !== asset.tag) {
                const existingTag = await Asset_1.default.findOne({ tag: validatedData.tag, _id: { $ne: asset._id } });
                if (existingTag)
                    return res.status(409).json((0, apiResponse_1.errorResponse)('Asset tag already exists'));
            }
            const updatedAsset = await Asset_1.default.findByIdAndUpdate(req.params.id, { $set: validatedData }, { new: true });
            return res.status(200).json((0, apiResponse_1.successResponse)('Asset updated successfully', updatedAsset));
        }
        catch (error) {
            if (error.name === 'ZodError')
                return res.status(400).json((0, apiResponse_1.errorResponse)(error.errors[0].message));
            return res.status(500).json((0, apiResponse_1.errorResponse)('Failed to update asset'));
        }
    };
    static toggleAssetStatus = async (req, res) => {
        try {
            const { status } = req.body;
            if (!['AVAILABLE', 'ALLOCATED', 'MAINTENANCE', 'RETIRED'].includes(status)) {
                return res.status(400).json((0, apiResponse_1.errorResponse)('Invalid status value'));
            }
            const asset = await Asset_1.default.findById(req.params.id);
            if (!asset)
                return res.status(404).json((0, apiResponse_1.errorResponse)('Asset not found'));
            asset.status = status;
            await asset.save();
            return res.status(200).json((0, apiResponse_1.successResponse)(`Asset status updated to ${status}`, asset));
        }
        catch (error) {
            return res.status(500).json((0, apiResponse_1.errorResponse)('Failed to update asset status'));
        }
    };
}
exports.AssetController = AssetController;
