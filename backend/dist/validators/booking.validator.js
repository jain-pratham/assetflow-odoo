"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelBookingSchema = exports.approveRejectBookingSchema = exports.createBookingSchema = void 0;
const zod_1 = require("zod");
exports.createBookingSchema = zod_1.z.object({
    resourceId: zod_1.z.string({ message: 'Resource is required' }),
    categoryId: zod_1.z.string({ message: 'Category is required' }),
    departmentId: zod_1.z.string({ message: 'Department is required' }),
    employeeId: zod_1.z.string({ message: 'Employee is required' }),
    bookingDate: zod_1.z.string({ message: 'Booking date is required' }),
    startTime: zod_1.z.string({ message: 'Start time is required' }).regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)'),
    endTime: zod_1.z.string({ message: 'End time is required' }).regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)'),
    purpose: zod_1.z.string({ message: 'Purpose is required' }).min(3, 'Purpose must be at least 3 characters').max(500),
    remarks: zod_1.z.string().max(500).optional().nullable(),
});
exports.approveRejectBookingSchema = zod_1.z.object({
    remarks: zod_1.z.string().max(500).optional().nullable(),
});
exports.cancelBookingSchema = zod_1.z.object({
    remarks: zod_1.z.string().max(500).optional().nullable(),
});
