"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMaintenanceStatusSchema = exports.assignMaintenanceSchema = exports.createMaintenanceSchema = void 0;
const zod_1 = require("zod");
exports.createMaintenanceSchema = zod_1.z.object({
    assetId: zod_1.z.string({ message: 'Asset is required' }).min(1, 'Asset is required'),
    categoryId: zod_1.z.string({ message: 'Category is required' }).min(1, 'Category is required'),
    departmentId: zod_1.z.string({ message: 'Department is required' }).min(1, 'Department is required'),
    reportedBy: zod_1.z.string({ message: 'Reported by is required' }).min(1, 'Reported by is required'),
    priority: zod_1.z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
    title: zod_1.z.string({ message: 'Issue title is required' }).min(3, 'Issue title must be at least 3 characters').max(150),
    description: zod_1.z.string({ message: 'Issue description is required' }).min(5, 'Issue description must be at least 5 characters').max(1000),
    scheduledDate: zod_1.z.string().optional().nullable(),
    remarks: zod_1.z.string().max(500).optional().nullable(),
});
exports.assignMaintenanceSchema = zod_1.z.object({
    assignedTechnicianId: zod_1.z.string({ message: 'Technician is required' }).min(1, 'Technician is required'),
    assignmentDate: zod_1.z.string().optional().nullable(),
    scheduledDate: zod_1.z.string({ message: 'Expected completion is required' }).min(1, 'Expected completion is required'),
    remarks: zod_1.z.string().max(500).optional().nullable(),
});
exports.updateMaintenanceStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
    remarks: zod_1.z.string().max(500).optional().nullable(),
});
