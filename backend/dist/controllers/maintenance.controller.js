"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaintenanceController = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Maintenance_1 = __importDefault(require("../models/Maintenance"));
const MaintenanceHistory_1 = __importDefault(require("../models/MaintenanceHistory"));
const Asset_1 = __importDefault(require("../models/Asset"));
const User_1 = require("../models/User");
const maintenance_validator_1 = require("../validators/maintenance.validator");
const apiResponse_1 = require("../utils/apiResponse");
const MANAGER_ROLES = [User_1.UserRole.ADMIN, User_1.UserRole.ASSET_MANAGER];
function isManager(role) {
    return !!role && MANAGER_ROLES.includes(role);
}
function getRbacQuery(user) {
    const role = user.role;
    if (isManager(role))
        return {};
    if (role === User_1.UserRole.TECHNICIAN)
        return { assignedTechnicianId: user._id };
    if (role === User_1.UserRole.DEPARTMENT_HEAD)
        return { departmentId: user.departmentId };
    return { reportedBy: user._id };
}
function canAccessMaintenance(user, maintenance) {
    const role = user.role;
    if (isManager(role))
        return true;
    if (role === User_1.UserRole.TECHNICIAN) {
        return maintenance.assignedTechnicianId?.toString() === user._id.toString();
    }
    if (role === User_1.UserRole.DEPARTMENT_HEAD) {
        return maintenance.departmentId?.toString() === user.departmentId?.toString();
    }
    return maintenance.reportedBy?.toString() === user._id.toString();
}
function actionForStatus(status) {
    if (status === 'ASSIGNED')
        return 'ASSIGNED';
    if (status === 'IN_PROGRESS')
        return 'STARTED';
    if (status === 'COMPLETED')
        return 'COMPLETED';
    if (status === 'CANCELLED')
        return 'CANCELLED';
    return 'CREATED';
}
async function generateRequestId(session) {
    const year = new Date().getFullYear();
    const prefix = `MR-${year}-`;
    const latest = await Maintenance_1.default.findOne({ requestId: { $regex: `^${prefix}` } })
        .sort({ createdAt: -1 })
        .select('requestId')
        .session(session)
        .lean();
    const next = latest?.requestId ? Number(latest.requestId.replace(prefix, '')) + 1 : 1;
    return `${prefix}${String(next).padStart(5, '0')}`;
}
async function createHistory(maintenance, action, performedBy, remarks, session) {
    await MaintenanceHistory_1.default.create([{
            maintenanceId: maintenance._id,
            assetId: maintenance.assetId,
            action,
            status: maintenance.status,
            performedBy,
            assignedTechnicianId: maintenance.assignedTechnicianId,
            remarks: remarks || undefined,
        }], { session });
}
class MaintenanceController {
    static getStats = async (req, res) => {
        try {
            const baseQuery = getRbacQuery(req.user);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const [openRequests, assigned, inProgress, completed, overdue, assetsUnderMaintenance] = await Promise.all([
                Maintenance_1.default.countDocuments({ ...baseQuery, status: 'OPEN' }),
                Maintenance_1.default.countDocuments({ ...baseQuery, status: 'ASSIGNED' }),
                Maintenance_1.default.countDocuments({ ...baseQuery, status: 'IN_PROGRESS' }),
                Maintenance_1.default.countDocuments({ ...baseQuery, status: 'COMPLETED' }),
                Maintenance_1.default.countDocuments({
                    ...baseQuery,
                    status: { $in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS'] },
                    scheduledDate: { $lt: today },
                }),
                Asset_1.default.countDocuments({ status: 'MAINTENANCE' }),
            ]);
            return res.status(200).json((0, apiResponse_1.successResponse)('Maintenance stats retrieved', {
                openRequests,
                assigned,
                inProgress,
                completed,
                overdue,
                assetsUnderMaintenance,
            }));
        }
        catch (error) {
            return res.status(500).json((0, apiResponse_1.errorResponse)('Failed to fetch maintenance stats'));
        }
    };
    static getMaintenance = async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;
            const query = { ...getRbacQuery(req.user) };
            if (req.query.status)
                query.status = req.query.status;
            if (req.query.departmentId)
                query.departmentId = req.query.departmentId;
            if (req.query.categoryId)
                query.categoryId = req.query.categoryId;
            if (req.query.technicianId)
                query.assignedTechnicianId = req.query.technicianId;
            if (req.query.priority)
                query.priority = req.query.priority;
            if (req.query.search) {
                query.$or = [
                    { requestId: { $regex: req.query.search, $options: 'i' } },
                    { title: { $regex: req.query.search, $options: 'i' } },
                    { description: { $regex: req.query.search, $options: 'i' } },
                ];
            }
            if (req.query.dateFrom || req.query.dateTo) {
                query.createdAt = {};
                if (req.query.dateFrom)
                    query.createdAt.$gte = new Date(req.query.dateFrom);
                if (req.query.dateTo) {
                    const to = new Date(req.query.dateTo);
                    to.setHours(23, 59, 59, 999);
                    query.createdAt.$lte = to;
                }
            }
            const total = await Maintenance_1.default.countDocuments(query);
            const records = await Maintenance_1.default.find(query)
                .populate('assetId', 'name tag status')
                .populate('categoryId', 'name code')
                .populate('departmentId', 'name')
                .populate('reportedBy', 'firstName lastName email')
                .populate('assignedTechnicianId', 'firstName lastName email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean();
            return res.status(200).json((0, apiResponse_1.successResponse)('Maintenance records retrieved', records, {
                total,
                page,
                pages: Math.ceil(total / limit) || 1,
            }));
        }
        catch (error) {
            return res.status(500).json((0, apiResponse_1.errorResponse)('Failed to fetch maintenance records'));
        }
    };
    static getHistory = async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;
            const maintenanceQuery = getRbacQuery(req.user);
            const scoped = await Maintenance_1.default.find(maintenanceQuery).select('_id').lean();
            const query = { maintenanceId: { $in: scoped.map((item) => item._id) } };
            if (req.query.status)
                query.status = req.query.status;
            if (req.query.action)
                query.action = req.query.action;
            if (req.query.dateFrom || req.query.dateTo) {
                query.createdAt = {};
                if (req.query.dateFrom)
                    query.createdAt.$gte = new Date(req.query.dateFrom);
                if (req.query.dateTo) {
                    const to = new Date(req.query.dateTo);
                    to.setHours(23, 59, 59, 999);
                    query.createdAt.$lte = to;
                }
            }
            const total = await MaintenanceHistory_1.default.countDocuments(query);
            const history = await MaintenanceHistory_1.default.find(query)
                .populate('maintenanceId', 'requestId title status')
                .populate('assetId', 'name tag')
                .populate('performedBy', 'firstName lastName')
                .populate('assignedTechnicianId', 'firstName lastName')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean();
            return res.status(200).json((0, apiResponse_1.successResponse)('Maintenance history retrieved', history, {
                total,
                page,
                pages: Math.ceil(total / limit) || 1,
            }));
        }
        catch (error) {
            return res.status(500).json((0, apiResponse_1.errorResponse)('Failed to fetch maintenance history'));
        }
    };
    static getCalendar = async (req, res) => {
        try {
            const query = { ...getRbacQuery(req.user) };
            if (req.query.dateFrom || req.query.dateTo) {
                query.scheduledDate = {};
                if (req.query.dateFrom)
                    query.scheduledDate.$gte = new Date(req.query.dateFrom);
                if (req.query.dateTo) {
                    const to = new Date(req.query.dateTo);
                    to.setHours(23, 59, 59, 999);
                    query.scheduledDate.$lte = to;
                }
            }
            else {
                query.scheduledDate = { $exists: true };
            }
            const records = await Maintenance_1.default.find(query)
                .populate('assetId', 'name tag')
                .populate('departmentId', 'name')
                .populate('assignedTechnicianId', 'firstName lastName')
                .sort({ scheduledDate: 1, createdAt: 1 })
                .lean();
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const events = records.map((item) => ({
                id: item._id,
                requestId: item.requestId,
                title: `${item.requestId} - ${item.assetId?.name || 'Asset'}`,
                date: item.scheduledDate || item.createdAt,
                status: item.status,
                isOverdue: item.scheduledDate && new Date(item.scheduledDate) < today && !['COMPLETED', 'CANCELLED'].includes(item.status),
                asset: item.assetId,
                department: item.departmentId,
                technician: item.assignedTechnicianId,
                priority: item.priority,
                remarks: item.remarks,
            }));
            return res.status(200).json((0, apiResponse_1.successResponse)('Maintenance calendar retrieved', events));
        }
        catch (error) {
            return res.status(500).json((0, apiResponse_1.errorResponse)('Failed to fetch maintenance calendar'));
        }
    };
    static getById = async (req, res) => {
        try {
            const record = await Maintenance_1.default.findById(req.params.id)
                .populate('assetId', 'name tag serialNumber status')
                .populate('categoryId', 'name code')
                .populate('departmentId', 'name')
                .populate('reportedBy', 'firstName lastName email')
                .populate('assignedTechnicianId', 'firstName lastName email')
                .lean();
            if (!record)
                return res.status(404).json((0, apiResponse_1.errorResponse)('Maintenance request not found'));
            if (!canAccessMaintenance(req.user, record))
                return res.status(403).json((0, apiResponse_1.errorResponse)('Access denied'));
            return res.status(200).json((0, apiResponse_1.successResponse)('Maintenance request retrieved', record));
        }
        catch (error) {
            return res.status(500).json((0, apiResponse_1.errorResponse)('Failed to fetch maintenance request'));
        }
    };
    static createMaintenance = async (req, res) => {
        const session = await mongoose_1.default.startSession();
        session.startTransaction();
        try {
            const data = maintenance_validator_1.createMaintenanceSchema.parse(req.body);
            const role = req.user.role;
            if (role === User_1.UserRole.EMPLOYEE && data.reportedBy !== req.user._id.toString()) {
                throw new Error('Employees can only create maintenance requests for themselves');
            }
            if (role === User_1.UserRole.DEPARTMENT_HEAD && data.departmentId !== req.user.departmentId?.toString()) {
                throw new Error('Department heads can only create requests for their department');
            }
            const asset = await Asset_1.default.findById(data.assetId).session(session);
            if (!asset)
                throw new Error('Asset not found');
            const requestId = await generateRequestId(session);
            const [maintenance] = await Maintenance_1.default.create([{
                    requestId,
                    assetId: data.assetId,
                    categoryId: data.categoryId,
                    departmentId: data.departmentId,
                    reportedBy: data.reportedBy,
                    priority: data.priority,
                    title: data.title,
                    description: data.description,
                    status: 'OPEN',
                    scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : undefined,
                    remarks: data.remarks || undefined,
                }], { session });
            await createHistory(maintenance, 'CREATED', req.user._id, data.remarks, session);
            await session.commitTransaction();
            const populated = await Maintenance_1.default.findById(maintenance._id)
                .populate('assetId', 'name tag status')
                .populate('categoryId', 'name')
                .populate('departmentId', 'name')
                .populate('reportedBy', 'firstName lastName')
                .lean();
            return res.status(201).json((0, apiResponse_1.successResponse)('Maintenance request created successfully', populated));
        }
        catch (error) {
            await session.abortTransaction();
            if (error.name === 'ZodError') {
                const issues = error.errors || error.issues || [];
                return res.status(400).json((0, apiResponse_1.errorResponse)(issues[0]?.message || 'Validation failed'));
            }
            return res.status(400).json((0, apiResponse_1.errorResponse)(error.message || 'Failed to create maintenance request'));
        }
        finally {
            session.endSession();
        }
    };
    static assignTechnician = async (req, res) => {
        const session = await mongoose_1.default.startSession();
        session.startTransaction();
        try {
            const data = maintenance_validator_1.assignMaintenanceSchema.parse(req.body);
            const maintenance = await Maintenance_1.default.findById(req.params.id).session(session);
            if (!maintenance)
                throw new Error('Maintenance request not found');
            if (maintenance.status !== 'OPEN')
                throw new Error('Only OPEN requests can be assigned');
            maintenance.assignedTechnicianId = new mongoose_1.default.Types.ObjectId(data.assignedTechnicianId);
            maintenance.scheduledDate = new Date(data.scheduledDate);
            maintenance.status = 'ASSIGNED';
            maintenance.remarks = data.remarks || maintenance.remarks;
            await maintenance.save({ session });
            await createHistory(maintenance, 'ASSIGNED', req.user._id, data.remarks, session);
            await session.commitTransaction();
            return res.status(200).json((0, apiResponse_1.successResponse)('Technician assigned successfully', maintenance));
        }
        catch (error) {
            await session.abortTransaction();
            if (error.name === 'ZodError') {
                const issues = error.errors || error.issues || [];
                return res.status(400).json((0, apiResponse_1.errorResponse)(issues[0]?.message || 'Validation failed'));
            }
            return res.status(400).json((0, apiResponse_1.errorResponse)(error.message || 'Failed to assign technician'));
        }
        finally {
            session.endSession();
        }
    };
    static updateStatus = async (req, res) => {
        const session = await mongoose_1.default.startSession();
        session.startTransaction();
        try {
            const data = maintenance_validator_1.updateMaintenanceStatusSchema.parse(req.body);
            const maintenance = await Maintenance_1.default.findById(req.params.id).session(session);
            if (!maintenance)
                throw new Error('Maintenance request not found');
            const role = req.user.role;
            if (role === User_1.UserRole.TECHNICIAN && maintenance.assignedTechnicianId?.toString() !== req.user._id.toString()) {
                throw new Error('Technicians can only update assigned jobs');
            }
            if (!isManager(role) && role !== User_1.UserRole.TECHNICIAN) {
                throw new Error('You are not allowed to update maintenance status');
            }
            const allowed = {
                OPEN: ['CANCELLED'],
                ASSIGNED: ['IN_PROGRESS', 'CANCELLED'],
                IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
                COMPLETED: [],
                CANCELLED: [],
            };
            if (!allowed[maintenance.status].includes(data.status)) {
                throw new Error(`Cannot change status from ${maintenance.status} to ${data.status}`);
            }
            maintenance.status = data.status;
            maintenance.remarks = data.remarks || maintenance.remarks;
            if (data.status === 'IN_PROGRESS') {
                await Asset_1.default.findByIdAndUpdate(maintenance.assetId, { status: 'MAINTENANCE' }, { session });
            }
            if (data.status === 'COMPLETED') {
                maintenance.completedDate = new Date();
                await Asset_1.default.findByIdAndUpdate(maintenance.assetId, { status: 'AVAILABLE' }, { session });
            }
            await maintenance.save({ session });
            await createHistory(maintenance, actionForStatus(data.status), req.user._id, data.remarks, session);
            await session.commitTransaction();
            return res.status(200).json((0, apiResponse_1.successResponse)('Maintenance status updated successfully', maintenance));
        }
        catch (error) {
            await session.abortTransaction();
            if (error.name === 'ZodError') {
                const issues = error.errors || error.issues || [];
                return res.status(400).json((0, apiResponse_1.errorResponse)(issues[0]?.message || 'Validation failed'));
            }
            return res.status(400).json((0, apiResponse_1.errorResponse)(error.message || 'Failed to update maintenance status'));
        }
        finally {
            session.endSession();
        }
    };
}
exports.MaintenanceController = MaintenanceController;
