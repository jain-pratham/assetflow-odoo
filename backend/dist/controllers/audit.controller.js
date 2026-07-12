"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditController = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Audit_1 = __importDefault(require("../models/Audit"));
const AuditItem_1 = __importDefault(require("../models/AuditItem"));
const AuditHistory_1 = __importDefault(require("../models/AuditHistory"));
const Asset_1 = __importDefault(require("../models/Asset"));
const audit_validator_1 = require("../validators/audit.validator");
const apiResponse_1 = require("../utils/apiResponse");
const User_1 = require("../models/User");
const notification_service_1 = require("../services/notification.service");
// ── Helpers ───────────────────────────────────────────────────────────────────
async function generateAuditNumber() {
    const count = await Audit_1.default.countDocuments();
    const num = String(count + 1).padStart(5, '0');
    return `AUD-${num}`;
}
function getRbacQuery(user) {
    const role = user.role;
    if (role === User_1.UserRole.ADMIN || role === User_1.UserRole.ASSET_MANAGER)
        return {};
    if (role === User_1.UserRole.DEPARTMENT_HEAD)
        return { departmentId: user.departmentId };
    return {}; // EMPLOYEE sees all audits but item access is filtered
}
class AuditController {
    // GET /api/audit/stats
    static getStats = async (req, res) => {
        try {
            const roleQuery = getRbacQuery(req.user);
            // Asset scoping
            const assetQuery = {};
            if (req.user.role === User_1.UserRole.DEPARTMENT_HEAD)
                assetQuery.department = req.user.departmentId;
            if (req.user.role === User_1.UserRole.EMPLOYEE)
                assetQuery.assignedTo = req.user._id;
            const [totalAssets, auditedAssets, pendingVerification, missingAssets, damagedAssets, completedAudits,] = await Promise.all([
                Asset_1.default.countDocuments(assetQuery),
                AuditItem_1.default.countDocuments({ verificationStatus: { $ne: 'PENDING' } }),
                AuditItem_1.default.countDocuments({ verificationStatus: 'PENDING' }),
                AuditItem_1.default.countDocuments({ verificationStatus: 'MISSING' }),
                AuditItem_1.default.countDocuments({ verificationStatus: 'DAMAGED' }),
                Audit_1.default.countDocuments({ ...roleQuery, status: 'COMPLETED' }),
            ]);
            return res.status(200).json((0, apiResponse_1.successResponse)('Audit stats retrieved', {
                totalAssets,
                auditedAssets,
                pendingVerification,
                missingAssets,
                damagedAssets,
                completedAudits,
            }));
        }
        catch (error) {
            console.error('Audit stats error:', error);
            return res.status(500).json((0, apiResponse_1.errorResponse)('Failed to fetch audit stats'));
        }
    };
    // GET /api/audit
    static getAudits = async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;
            const query = { ...getRbacQuery(req.user) };
            if (req.query.status)
                query.status = req.query.status;
            if (req.query.departmentId)
                query.departmentId = req.query.departmentId;
            if (req.query.search) {
                query.$or = [
                    { name: { $regex: req.query.search, $options: 'i' } },
                    { auditNumber: { $regex: req.query.search, $options: 'i' } },
                ];
            }
            const total = await Audit_1.default.countDocuments(query);
            const audits = await Audit_1.default.find(query)
                .populate('departmentId', 'name')
                .populate('categoryId', 'name code')
                .populate('createdBy', 'firstName lastName')
                .populate('assignedAuditor', 'firstName lastName')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean();
            return res.status(200).json((0, apiResponse_1.successResponse)('Audits retrieved', audits, {
                total, page, pages: Math.ceil(total / limit) || 1,
            }));
        }
        catch (error) {
            return res.status(500).json((0, apiResponse_1.errorResponse)('Failed to fetch audits'));
        }
    };
    // GET /api/audit/history
    static getHistory = async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;
            const query = {};
            // EMPLOYEE scoping — only see history for their assets
            if (req.user.role === User_1.UserRole.EMPLOYEE) {
                const myAssets = await Asset_1.default.find({ assignedTo: req.user._id }).select('_id').lean();
                query.assetId = { $in: myAssets.map((a) => a._id) };
            }
            const total = await AuditHistory_1.default.countDocuments(query);
            const history = await AuditHistory_1.default.find(query)
                .populate('auditId', 'auditNumber name status')
                .populate('assetId', 'name tag')
                .populate('performedBy', 'firstName lastName')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean();
            return res.status(200).json((0, apiResponse_1.successResponse)('Audit history retrieved', history, {
                total, page, pages: Math.ceil(total / limit) || 1,
            }));
        }
        catch (error) {
            return res.status(500).json((0, apiResponse_1.errorResponse)('Failed to fetch audit history'));
        }
    };
    // GET /api/audit/discrepancies
    static getDiscrepancies = async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;
            const query = {
                verificationStatus: { $in: ['MISSING', 'DAMAGED', 'RETIRED'] },
            };
            // RBAC: dept head only sees their dept's items
            if (req.user.role === User_1.UserRole.DEPARTMENT_HEAD) {
                const deptAssets = await Asset_1.default.find({ department: req.user.departmentId }).select('_id').lean();
                query.assetId = { $in: deptAssets.map((a) => a._id) };
            }
            else if (req.user.role === User_1.UserRole.EMPLOYEE) {
                const myAssets = await Asset_1.default.find({ assignedTo: req.user._id }).select('_id').lean();
                query.assetId = { $in: myAssets.map((a) => a._id) };
            }
            const total = await AuditItem_1.default.countDocuments(query);
            const items = await AuditItem_1.default.find(query)
                .populate('auditId', 'auditNumber name status')
                .populate({
                path: 'assetId',
                select: 'name tag department assignedTo',
                populate: [
                    { path: 'department', select: 'name' },
                    { path: 'assignedTo', select: 'firstName lastName' },
                ],
            })
                .populate('verifiedBy', 'firstName lastName')
                .sort({ updatedAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean();
            return res.status(200).json((0, apiResponse_1.successResponse)('Discrepancies retrieved', items, {
                total, page, pages: Math.ceil(total / limit) || 1,
            }));
        }
        catch (error) {
            return res.status(500).json((0, apiResponse_1.errorResponse)('Failed to fetch discrepancies'));
        }
    };
    // GET /api/audit/:id
    static getById = async (req, res) => {
        try {
            const audit = await Audit_1.default.findById(req.params.id)
                .populate('departmentId', 'name')
                .populate('categoryId', 'name')
                .populate('createdBy', 'firstName lastName')
                .populate('assignedAuditor', 'firstName lastName')
                .lean();
            if (!audit)
                return res.status(404).json((0, apiResponse_1.errorResponse)('Audit not found'));
            const items = await AuditItem_1.default.find({ auditId: req.params.id })
                .populate('assetId', 'name tag category department assignedTo condition status')
                .populate('verifiedBy', 'firstName lastName')
                .lean();
            return res.status(200).json((0, apiResponse_1.successResponse)('Audit retrieved', { ...audit, items }));
        }
        catch (error) {
            return res.status(500).json((0, apiResponse_1.errorResponse)('Failed to fetch audit'));
        }
    };
    // POST /api/audit
    static createAudit = async (req, res) => {
        const session = await mongoose_1.default.startSession();
        session.startTransaction();
        try {
            const data = audit_validator_1.createAuditSchema.parse(req.body);
            // RBAC: DEPT_HEAD can only start for own department
            if (req.user.role === User_1.UserRole.DEPARTMENT_HEAD) {
                if (data.departmentId && data.departmentId !== req.user.departmentId?.toString()) {
                    throw new Error('You can only start audits for your own department');
                }
                data.departmentId = req.user.departmentId?.toString();
            }
            const auditNumber = await generateAuditNumber();
            // Build asset query to scope the audit
            const assetQuery = { status: { $ne: 'RETIRED' } };
            if (data.departmentId)
                assetQuery.department = data.departmentId;
            if (data.categoryId)
                assetQuery.category = data.categoryId;
            const assets = await Asset_1.default.find(assetQuery).select('_id').lean();
            const [audit] = await Audit_1.default.create([{
                    auditNumber,
                    name: data.name,
                    departmentId: data.departmentId || undefined,
                    categoryId: data.categoryId || undefined,
                    createdBy: req.user._id,
                    assignedAuditor: data.assignedAuditor,
                    status: 'OPEN',
                    startDate: new Date(data.startDate),
                    endDate: data.endDate ? new Date(data.endDate) : undefined,
                    remarks: data.remarks,
                }], { session });
            // Create AuditItems for all scoped assets
            if (assets.length > 0) {
                const auditItems = assets.map((asset) => ({
                    auditId: audit._id,
                    assetId: asset._id,
                    verificationStatus: 'PENDING',
                }));
                await AuditItem_1.default.insertMany(auditItems, { session });
            }
            // Create history
            await AuditHistory_1.default.create([{
                    auditId: audit._id,
                    action: 'CREATED',
                    performedBy: req.user._id,
                    remarks: `Audit ${auditNumber} created with ${assets.length} assets`,
                }], { session });
            await session.commitTransaction();
            const populated = await Audit_1.default.findById(audit._id)
                .populate('departmentId', 'name')
                .populate('categoryId', 'name')
                .populate('assignedAuditor', 'firstName lastName')
                .lean();
            await notification_service_1.NotificationService.createNotification({
                title: 'Audit Assigned',
                message: `You have been assigned to perform Audit ${auditNumber}.`,
                type: 'AUDIT',
                priority: 'HIGH',
                recipient: data.assignedAuditor,
                entityType: 'Audit',
                entityId: audit._id,
                actionUrl: '/audit',
            });
            await notification_service_1.NotificationService.logActivity({
                actor: req.user._id,
                action: 'CREATED_AUDIT',
                target: auditNumber,
                entityType: 'Audit',
                entityId: audit._id
            });
            return res.status(201).json((0, apiResponse_1.successResponse)('Audit started successfully', { ...populated, assetCount: assets.length }));
        }
        catch (error) {
            await session.abortTransaction();
            if (error.name === 'ZodError') {
                const issues = error.errors || error.issues || [];
                return res.status(400).json((0, apiResponse_1.errorResponse)(issues[0]?.message || 'Validation failed'));
            }
            return res.status(400).json((0, apiResponse_1.errorResponse)(error.message || 'Failed to create audit'));
        }
        finally {
            session.endSession();
        }
    };
    // PUT /api/audit/:id/start (set to IN_PROGRESS)
    static startAudit = async (req, res) => {
        try {
            const audit = await Audit_1.default.findById(req.params.id);
            if (!audit)
                return res.status(404).json((0, apiResponse_1.errorResponse)('Audit not found'));
            if (audit.status !== 'OPEN')
                return res.status(400).json((0, apiResponse_1.errorResponse)('Only OPEN audits can be started'));
            audit.status = 'IN_PROGRESS';
            await audit.save();
            await AuditHistory_1.default.create({
                auditId: audit._id,
                action: 'UPDATED',
                performedBy: req.user._id,
                remarks: 'Audit set to IN_PROGRESS',
            });
            return res.status(200).json((0, apiResponse_1.successResponse)('Audit started', audit));
        }
        catch (error) {
            return res.status(500).json((0, apiResponse_1.errorResponse)(error.message || 'Failed to start audit'));
        }
    };
    // PUT /api/audit/:id/verify
    static verifyAsset = async (req, res) => {
        const session = await mongoose_1.default.startSession();
        session.startTransaction();
        try {
            const data = audit_validator_1.verifyAssetSchema.parse(req.body);
            const audit = await Audit_1.default.findById(req.params.id).session(session);
            if (!audit)
                throw new Error('Audit not found');
            if (audit.status === 'COMPLETED' || audit.status === 'CANCELLED') {
                throw new Error('Cannot verify assets in a completed or cancelled audit');
            }
            // RBAC: DEPT_HEAD can only verify their dept assets
            if (req.user.role === User_1.UserRole.DEPARTMENT_HEAD) {
                const asset = await Asset_1.default.findById(data.assetId);
                if (!asset || asset.department?.toString() !== req.user.departmentId?.toString()) {
                    throw new Error('You can only verify assets from your own department');
                }
            }
            // Upsert AuditItem
            let item = await AuditItem_1.default.findOne({ auditId: req.params.id, assetId: data.assetId }).session(session);
            if (!item) {
                // New item — create it (asset added mid-audit)
                const [created] = await AuditItem_1.default.create([{
                        auditId: req.params.id,
                        assetId: data.assetId,
                        verificationStatus: data.verificationStatus,
                        condition: data.condition,
                        remarks: data.remarks,
                        verifiedBy: req.user._id,
                        verifiedAt: new Date(),
                    }], { session });
                item = created;
            }
            else {
                item.verificationStatus = data.verificationStatus;
                item.condition = data.condition;
                item.remarks = data.remarks || item.remarks;
                item.verifiedBy = req.user._id;
                item.verifiedAt = new Date();
                await item.save({ session });
            }
            // If IN_PROGRESS, update audit status
            if (audit.status === 'OPEN') {
                audit.status = 'IN_PROGRESS';
                await audit.save({ session });
            }
            // Create history
            await AuditHistory_1.default.create([{
                    auditId: req.params.id,
                    assetId: data.assetId,
                    action: 'VERIFIED',
                    performedBy: req.user._id,
                    remarks: `${data.verificationStatus}${data.remarks ? ': ' + data.remarks : ''}`,
                }], { session });
            await session.commitTransaction();
            return res.status(200).json((0, apiResponse_1.successResponse)('Asset verified successfully', item));
        }
        catch (error) {
            await session.abortTransaction();
            if (error.name === 'ZodError') {
                const issues = error.errors || error.issues || [];
                return res.status(400).json((0, apiResponse_1.errorResponse)(issues[0]?.message || 'Validation failed'));
            }
            return res.status(400).json((0, apiResponse_1.errorResponse)(error.message || 'Failed to verify asset'));
        }
        finally {
            session.endSession();
        }
    };
    // PUT /api/audit/:id/complete
    static completeAudit = async (req, res) => {
        const session = await mongoose_1.default.startSession();
        session.startTransaction();
        try {
            const data = audit_validator_1.completeAuditSchema.parse(req.body);
            const audit = await Audit_1.default.findById(req.params.id).session(session);
            if (!audit)
                throw new Error('Audit not found');
            if (audit.status === 'COMPLETED')
                throw new Error('Audit is already completed');
            if (audit.status === 'CANCELLED')
                throw new Error('Cannot complete a cancelled audit');
            // Check if all items are verified
            const pendingCount = await AuditItem_1.default.countDocuments({
                auditId: req.params.id,
                verificationStatus: 'PENDING',
            });
            if (pendingCount > 0) {
                throw new Error(`${pendingCount} asset(s) still pending verification. Complete all verifications first.`);
            }
            audit.status = 'COMPLETED';
            audit.endDate = new Date();
            audit.remarks = data.remarks || audit.remarks;
            await audit.save({ session });
            await AuditHistory_1.default.create([{
                    auditId: audit._id,
                    action: 'COMPLETED',
                    performedBy: req.user._id,
                    remarks: data.remarks || 'Audit completed',
                }], { session });
            await session.commitTransaction();
            await notification_service_1.NotificationService.createNotification({
                title: 'Audit Completed',
                message: `Audit ${audit.auditNumber} has been marked as completed.`,
                type: 'AUDIT',
                priority: 'MEDIUM',
                recipient: audit.createdBy.toString(),
                entityType: 'Audit',
                entityId: audit._id,
                actionUrl: '/audit',
            });
            await notification_service_1.NotificationService.logActivity({
                actor: req.user._id,
                action: 'COMPLETED_AUDIT',
                target: audit.auditNumber,
                entityType: 'Audit',
                entityId: audit._id
            });
            return res.status(200).json((0, apiResponse_1.successResponse)('Audit completed successfully', audit));
        }
        catch (error) {
            await session.abortTransaction();
            if (error.name === 'ZodError') {
                const issues = error.errors || error.issues || [];
                return res.status(400).json((0, apiResponse_1.errorResponse)(issues[0]?.message || 'Validation failed'));
            }
            return res.status(400).json((0, apiResponse_1.errorResponse)(error.message || 'Failed to complete audit'));
        }
        finally {
            session.endSession();
        }
    };
}
exports.AuditController = AuditController;
