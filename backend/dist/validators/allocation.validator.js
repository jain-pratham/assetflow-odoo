"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.returnAssetSchema = exports.transferAssetSchema = exports.allocateAssetSchema = void 0;
const zod_1 = require("zod");
exports.allocateAssetSchema = zod_1.z.object({
    assetId: zod_1.z.string({ required_error: 'Asset is required' }),
    employeeId: zod_1.z.string({ required_error: 'Employee is required' }),
    departmentId: zod_1.z.string({ required_error: 'Department is required' }),
    allocatedAt: zod_1.z.string().optional(),
    expectedReturnDate: zod_1.z.string().optional().nullable(),
    remarks: zod_1.z.string().max(500, 'Remarks cannot exceed 500 characters').optional().nullable(),
});
exports.transferAssetSchema = zod_1.z.object({
    newEmployeeId: zod_1.z.string({ required_error: 'New employee is required' }),
    newDepartmentId: zod_1.z.string({ required_error: 'New department is required' }),
    remarks: zod_1.z.string().max(500, 'Remarks cannot exceed 500 characters').optional().nullable(),
});
exports.returnAssetSchema = zod_1.z.object({
    condition: zod_1.z.enum(['EXCELLENT', 'GOOD', 'FAIR', 'POOR'], { required_error: 'Condition is required' }),
    remarks: zod_1.z.string().max(500, 'Remarks cannot exceed 500 characters').optional().nullable(),
    returnedAt: zod_1.z.string().optional(),
});
