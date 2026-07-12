import mongoose from 'mongoose';
import { User, UserStatus } from '../models/User';
import Asset from '../models/Asset';
import Booking from '../models/Booking';
import Maintenance from '../models/Maintenance';
import Audit from '../models/Audit';
import Category from '../models/Category';
import { Department } from '../models/Department';
import { Notification } from '../models/Notification';
import { ActivityLog } from '../models/ActivityLog';
import AllocationHistory from '../models/AllocationHistory';

export interface DashboardFilters {
  dateRange?: string; // e.g. TODAY, WEEK, MONTH, YEAR
  startDate?: string;
  endDate?: string;
  departmentId?: string;
  status?: string;
}

export class DashboardService {
  
  static async getStats(filters: DashboardFilters, adminId: string) {
    // Basic match for department if provided
    const deptMatch = filters.departmentId ? { departmentId: new mongoose.Types.ObjectId(filters.departmentId) } : {};
    const assetDeptMatch = filters.departmentId ? { department: new mongoose.Types.ObjectId(filters.departmentId) } : {};
    const auditDeptMatch = filters.departmentId ? { departmentId: new mongoose.Types.ObjectId(filters.departmentId) } : {};

    const [
      totalEmployees, activeEmployees, inactiveEmployees,
      departments, categories,
      totalAssets, availableAssets, allocatedAssets, maintenanceAssets,
      todayBookings, pendingBookings,
      pendingMaintenance,
      openAudits, completedAudits,
      unreadNotifications
    ] = await Promise.all([
      User.countDocuments(deptMatch as any),
      User.countDocuments({ ...deptMatch, status: 'ACTIVE' } as any),
      User.countDocuments({ ...deptMatch, status: 'INACTIVE' } as any),
      Department.countDocuments(),
      Category.countDocuments(),
      
      Asset.countDocuments(assetDeptMatch),
      Asset.countDocuments({ ...assetDeptMatch, status: 'AVAILABLE' }),
      Asset.countDocuments({ ...assetDeptMatch, status: 'ALLOCATED' }),
      Asset.countDocuments({ ...assetDeptMatch, status: 'MAINTENANCE' }),
      
      Booking.countDocuments({ 
        ...deptMatch, 
        bookingDate: { 
          $gte: new Date(new Date().setHours(0,0,0,0)), 
          $lt: new Date(new Date().setHours(23,59,59,999)) 
        } 
      }),
      Booking.countDocuments({ ...deptMatch, status: 'PENDING' }),
      
      Maintenance.countDocuments({ ...deptMatch, status: { $in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS'] } }),
      
      Audit.countDocuments({ ...auditDeptMatch, status: { $in: ['OPEN', 'IN_PROGRESS'] } }),
      Audit.countDocuments({ ...auditDeptMatch, status: 'COMPLETED' }),
      
      Notification.countDocuments({ userId: new mongoose.Types.ObjectId(adminId), isRead: false })
    ]);

    return {
      totalEmployees, activeEmployees, inactiveEmployees,
      departments, categories,
      totalAssets, availableAssets, allocatedAssets, maintenanceAssets,
      todayBookings, pendingBookings,
      pendingMaintenance,
      openAudits, completedAudits,
      unreadNotifications
    };
  }

  static async getCharts(filters: DashboardFilters) {
    const assetDeptMatch = filters.departmentId ? { department: new mongoose.Types.ObjectId(filters.departmentId) } : {};
    const bookingDeptMatch = filters.departmentId ? { departmentId: new mongoose.Types.ObjectId(filters.departmentId) } : {};

    const currentYear = new Date().getFullYear();
    const startOfYr = new Date(currentYear, 0, 1);
    const endOfYr = new Date(currentYear, 11, 31, 23, 59, 59);

    const [
      assetsByCategory,
      assetsByDepartment,
      monthlyAllocations,
      monthlyBookings,
      maintenanceStatus,
      auditStatus
    ] = await Promise.all([
      // Assets By Category
      Asset.aggregate([
        { $match: assetDeptMatch },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'cat' } },
        { $unwind: '$cat' },
        { $project: { name: '$cat.name', value: '$count', _id: 0 } },
        { $sort: { value: -1 } }
      ]),
      
      // Assets By Department
      Asset.aggregate([
        { $match: assetDeptMatch },
        { $group: { _id: '$department', count: { $sum: 1 } } },
        { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'dept' } },
        { $unwind: '$dept' },
        { $project: { name: '$dept.name', value: '$count', _id: 0 } },
        { $sort: { value: -1 } }
      ]),

      // Monthly Allocation Trend (Current Year)
      AllocationHistory.aggregate([
        { $match: { 
            action: 'ALLOCATED', 
            createdAt: { $gte: startOfYr, $lte: endOfYr }
        }},
        { $group: { _id: { $month: '$createdAt' }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]).then(res => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const data = months.map((m, i) => ({ name: m, allocations: 0 }));
        res.forEach(r => data[r._id - 1].allocations = r.count);
        return data;
      }),

      // Monthly Booking Trend (Current Year)
      Booking.aggregate([
        { $match: { 
            ...bookingDeptMatch,
            createdAt: { $gte: startOfYr, $lte: endOfYr }
        }},
        { $group: { _id: { $month: '$createdAt' }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]).then(res => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const data = months.map((m, i) => ({ name: m, bookings: 0 }));
        res.forEach(r => data[r._id - 1].bookings = r.count);
        return data;
      }),

      // Maintenance Status
      Maintenance.aggregate([
        { $match: bookingDeptMatch }, // using same dept match field
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $project: { name: '$_id', value: '$count', _id: 0 } }
      ]),

      // Audit Status
      Audit.aggregate([
        { $match: bookingDeptMatch },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $project: { name: '$_id', value: '$count', _id: 0 } }
      ])
    ]);

    return {
      assetsByCategory,
      assetsByDepartment,
      monthlyAllocations,
      monthlyBookings,
      maintenanceStatus,
      auditStatus
    };
  }

  static async getRecentData(filters: DashboardFilters, adminId: string) {
    const limit = 5;
    
    const [employees, assets, bookings, maintenance, audits, notifications, activity] = await Promise.all([
      User.find().sort({ createdAt: -1 }).limit(limit).populate('departmentId', 'name'),
      Asset.find().sort({ createdAt: -1 }).limit(limit).populate('category', 'name').populate('department', 'name').populate('assignedTo', 'firstName lastName'),
      Booking.find().sort({ createdAt: -1 }).limit(limit).populate('employeeId', 'firstName lastName').populate('resourceId', 'name'),
      Maintenance.find().sort({ createdAt: -1 }).limit(limit).populate('assetId', 'name').populate('assignedTechnicianId', 'firstName lastName'),
      Audit.find().sort({ createdAt: -1 }).limit(limit).populate('departmentId', 'name').populate('assignedAuditor', 'firstName lastName'),
      Notification.find({ userId: new mongoose.Types.ObjectId(adminId) }).sort({ createdAt: -1 }).limit(10),
      ActivityLog.find().sort({ createdAt: -1 }).limit(15).populate('actor', 'firstName lastName avatar role')
    ]);

    return {
      employees,
      assets,
      bookings,
      maintenance,
      audits,
      notifications,
      activity
    };
  }

  static async globalSearch(query: string) {
    if (!query || query.length < 2) return [];
    
    const searchRegex = new RegExp(query, 'i');
    
    // Search across main collections in parallel
    const [employees, assets, departments, categories, bookings, maintenance, audits] = await Promise.all([
      User.find({ $or: [{ firstName: searchRegex }, { lastName: searchRegex }, { email: searchRegex }] }).limit(3).select('firstName lastName email role _id'),
      Asset.find({ $or: [{ name: searchRegex }, { tag: searchRegex }, { serialNumber: searchRegex }] }).limit(3).select('name tag status _id'),
      Department.find({ name: searchRegex }).limit(3).select('name code _id'),
      Category.find({ name: searchRegex }).limit(3).select('name code _id'),
      Booking.find({ purpose: searchRegex }).limit(3).select('purpose status _id'),
      Maintenance.find({ $or: [{ title: searchRegex }, { requestId: searchRegex }] }).limit(3).select('title requestId status _id'),
      Audit.find({ $or: [{ name: searchRegex }, { auditNumber: searchRegex }] }).limit(3).select('name auditNumber status _id')
    ]);

    const formatResults = (items: any[], type: string, urlPrefix: string, getTitle: (item: any) => string, getSub: (item: any) => string) => {
      return items.map(item => ({
        id: item._id.toString(),
        type,
        title: getTitle(item),
        subtitle: getSub(item),
        url: `${urlPrefix}/${item._id}`
      }));
    };

    return [
      ...formatResults(employees, 'Employee', '/organization/employees', e => `${e.firstName} ${e.lastName}`, e => e.email),
      ...formatResults(assets, 'Asset', '/assets', a => a.name, a => a.tag),
      ...formatResults(departments, 'Department', '/organization/departments', d => d.name, d => d.code),
      ...formatResults(categories, 'Category', '/organization/categories', c => c.name, c => c.code),
      ...formatResults(bookings, 'Booking', '/booking', b => b.purpose, b => b.status),
      ...formatResults(maintenance, 'Maintenance', '/maintenance', m => m.title, m => m.requestId),
      ...formatResults(audits, 'Audit', '/audit', a => a.name, a => a.auditNumber)
    ];
  }
}
