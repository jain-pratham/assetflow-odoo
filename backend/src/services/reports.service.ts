import mongoose from 'mongoose';
import Asset from '../models/Asset';
import Booking from '../models/Booking';
import Maintenance from '../models/Maintenance';
import Audit from '../models/Audit';
import { Department } from '../models/Department';
import { User, UserRole, UserStatus } from '../models/User';
import Category from '../models/Category';
import Allocation from '../models/Allocation';

export class ReportsService {
  
  static async getDashboardStats(roleQuery: any, assetQuery: any) {
    const [
      totalAssets,
      availableAssets,
      allocatedAssets,
      maintenanceAssets,
      totalEmployees,
      totalDepartments,
      completedAudits,
    ] = await Promise.all([
      Asset.countDocuments(assetQuery),
      Asset.countDocuments({ ...assetQuery, status: 'AVAILABLE' }),
      Asset.countDocuments({ ...assetQuery, status: 'ALLOCATED' }),
      Asset.countDocuments({ ...assetQuery, status: 'UNDER_MAINTENANCE' }),
      User.countDocuments({ status: UserStatus.ACTIVE, role: UserRole.EMPLOYEE }),
      Department.countDocuments({ status: 'ACTIVE' }),
      Audit.countDocuments({ ...roleQuery, status: 'COMPLETED' }),
    ]);

    // Bookings
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [todaysBookings, pendingBookings] = await Promise.all([
      Booking.countDocuments({ ...roleQuery, bookingDate: { $gte: today, $lt: tomorrow } }),
      Booking.countDocuments({ ...roleQuery, status: 'PENDING' }),
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

  static async getCharts(roleQuery: any, assetQuery: any) {
    // 1. Assets by Category
    const categoryAgg = await Asset.aggregate([
      { $match: assetQuery },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'cat' } },
      { $unwind: '$cat' },
      { $project: { name: '$cat.name', value: '$count', _id: 0 } }
    ]);

    // 2. Assets by Department
    const deptAgg = await Asset.aggregate([
      { $match: assetQuery },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'dept' } },
      { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
      { $project: { name: { $ifNull: ['$dept.name', 'Unassigned'] }, value: '$count', _id: 0 } }
    ]);

    // 3. Asset Status
    const statusAgg = await Asset.aggregate([
      { $match: assetQuery },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $project: { name: '$_id', value: '$count', _id: 0 } }
    ]);

    // 4. Monthly Bookings (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const bookingTrend = await Booking.aggregate([
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
    const maintenanceTrend = await Maintenance.aggregate([
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

  static async getAssetsReport(assetQuery: any, limit: number, skip: number) {
    const total = await Asset.countDocuments(assetQuery);
    const data = await Asset.find(assetQuery)
      .populate('category', 'name code')
      .populate('department', 'name')
      .populate('assignedTo', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    return { data, total };
  }

  static async getBookingsReport(query: any, limit: number, skip: number) {
    const total = await Booking.countDocuments(query);
    const data = await Booking.find(query)
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

  static async getMaintenanceReport(query: any, limit: number, skip: number) {
    const total = await Maintenance.countDocuments(query);
    const data = await Maintenance.find(query)
      .populate('assetId', 'name tag')
      .populate('reportedBy', 'firstName lastName')
      .populate('technicianId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    return { data, total };
  }

  static async getAuditReport(query: any, limit: number, skip: number) {
    const total = await Audit.countDocuments(query);
    const data = await Audit.find(query)
      .populate('departmentId', 'name')
      .populate('categoryId', 'name')
      .populate('assignedAuditor', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Attach verified/missing counts via aggregation per audit
    const enrichedData = await Promise.all(data.map(async (audit) => {
      const counts = await mongoose.model('AuditItem').aggregate([
        { $match: { auditId: audit._id } },
        { $group: { _id: '$verificationStatus', count: { $sum: 1 } } }
      ]);
      const missing = counts.find((c: any) => c._id === 'MISSING')?.count || 0;
      const damaged = counts.find((c: any) => c._id === 'DAMAGED')?.count || 0;
      const verified = counts.find((c: any) => c._id === 'AVAILABLE')?.count || 0;
      return { ...audit, stats: { missing, damaged, verified } };
    }));

    return { data: enrichedData, total };
  }
}
