"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Asset_1 = __importDefault(require("../models/Asset"));
const Booking_1 = __importDefault(require("../models/Booking"));
const Maintenance_1 = __importDefault(require("../models/Maintenance"));
const Audit_1 = __importDefault(require("../models/Audit"));
const Department_1 = require("../models/Department");
const User_1 = require("../models/User");
class ReportsService {
    static async getDashboardStats(roleQuery, assetQuery) {
        const [totalAssets, availableAssets, allocatedAssets, maintenanceAssets, totalEmployees, totalDepartments, completedAudits,] = await Promise.all([
            Asset_1.default.countDocuments(assetQuery),
            Asset_1.default.countDocuments({ ...assetQuery, status: 'AVAILABLE' }),
            Asset_1.default.countDocuments({ ...assetQuery, status: 'ALLOCATED' }),
            Asset_1.default.countDocuments({ ...assetQuery, status: 'UNDER_MAINTENANCE' }),
            User_1.User.countDocuments({ status: User_1.UserStatus.ACTIVE, role: User_1.UserRole.EMPLOYEE }),
            Department_1.Department.countDocuments({ status: 'ACTIVE' }),
            Audit_1.default.countDocuments({ ...roleQuery, status: 'COMPLETED' }),
        ]);
        // Bookings
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const [todaysBookings, pendingBookings] = await Promise.all([
            Booking_1.default.countDocuments({ ...roleQuery, bookingDate: { $gte: today, $lt: tomorrow } }),
            Booking_1.default.countDocuments({ ...roleQuery, status: 'PENDING' }),
        ]);
        return {
            totalAssets,
            availableAssets,
            allocatedAssets,
            maintenanceAssets,
            todaysBookings,
            pendingBookings,
            totalEmployees,
            totalDepartments,
            completedAudits,
        };
    }
    static async getCharts(roleQuery, assetQuery) {
        // 1. Assets by Category
        const categoryAgg = await Asset_1.default.aggregate([
            { $match: assetQuery },
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'cat' } },
            { $unwind: '$cat' },
            { $project: { name: '$cat.name', value: '$count', _id: 0 } }
        ]);
        // 2. Assets by Department
        const deptAgg = await Asset_1.default.aggregate([
            { $match: assetQuery },
            { $group: { _id: '$department', count: { $sum: 1 } } },
            { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'dept' } },
            { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
            { $project: { name: { $ifNull: ['$dept.name', 'Unassigned'] }, value: '$count', _id: 0 } }
        ]);
        // 3. Asset Status
        const statusAgg = await Asset_1.default.aggregate([
            { $match: assetQuery },
            { $group: { _id: '$status', count: { $sum: 1 } } },
            { $project: { name: '$_id', value: '$count', _id: 0 } }
        ]);
        // 4. Monthly Bookings (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const bookingTrend = await Booking_1.default.aggregate([
            { $match: { ...roleQuery, createdAt: { $gte: sixMonthsAgo } } },
            { $group: {
                    _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
            { $project: { name: { $concat: [{ $toString: '$_id.month' }, '/', { $toString: '$_id.year' }] }, value: '$count', _id: 0 } }
        ]);
        // 5. Monthly Maintenance
        const maintenanceTrend = await Maintenance_1.default.aggregate([
            { $match: { ...roleQuery, createdAt: { $gte: sixMonthsAgo } } },
            { $group: {
                    _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
            { $project: { name: { $concat: [{ $toString: '$_id.month' }, '/', { $toString: '$_id.year' }] }, value: '$count', _id: 0 } }
        ]);
        return {
            assetsByCategory: categoryAgg,
            assetsByDepartment: deptAgg,
            assetStatus: statusAgg,
            bookingTrend,
            maintenanceTrend,
        };
    }
    static async getAssetsReport(assetQuery, limit, skip) {
        const total = await Asset_1.default.countDocuments(assetQuery);
        const data = await Asset_1.default.find(assetQuery)
            .populate('category', 'name code')
            .populate('department', 'name')
            .populate('assignedTo', 'firstName lastName email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
        return { data, total };
    }
    static async getBookingsReport(query, limit, skip) {
        const total = await Booking_1.default.countDocuments(query);
        const data = await Booking_1.default.find(query)
            .populate('resourceId', 'name tag')
            .populate('employeeId', 'firstName lastName')
            .populate('departmentId', 'name')
            .populate('approvedBy', 'firstName lastName')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
        return { data, total };
    }
    static async getMaintenanceReport(query, limit, skip) {
        const total = await Maintenance_1.default.countDocuments(query);
        const data = await Maintenance_1.default.find(query)
            .populate('assetId', 'name tag')
            .populate('reportedBy', 'firstName lastName')
            .populate('technicianId', 'firstName lastName')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
        return { data, total };
    }
    static async getAuditReport(query, limit, skip) {
        const total = await Audit_1.default.countDocuments(query);
        const data = await Audit_1.default.find(query)
            .populate('departmentId', 'name')
            .populate('categoryId', 'name')
            .populate('assignedAuditor', 'firstName lastName')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
        // Attach verified/missing counts via aggregation per audit
        const enrichedData = await Promise.all(data.map(async (audit) => {
            const counts = await mongoose_1.default.model('AuditItem').aggregate([
                { $match: { auditId: audit._id } },
                { $group: { _id: '$verificationStatus', count: { $sum: 1 } } }
            ]);
            const missing = counts.find((c) => c._id === 'MISSING')?.count || 0;
            const damaged = counts.find((c) => c._id === 'DAMAGED')?.count || 0;
            const verified = counts.find((c) => c._id === 'AVAILABLE')?.count || 0;
            return { ...audit, stats: { missing, damaged, verified } };
        }));
        return { data: enrichedData, total };
    }
}
exports.ReportsService = ReportsService;
