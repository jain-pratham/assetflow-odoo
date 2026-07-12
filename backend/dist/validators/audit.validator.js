"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.completeAuditSchema = exports.verifyAssetSchema = exports.createAuditSchema = void 0;
const zod_1 = require("zod");
exports.createAuditSchema = zod_1.z.object({
    name: zod_1.z.string({ message: 'Audit name is required' }).min(3).max(200),
    departmentId: zod_1.z.string().optional().nullable(),
    categoryId: zod_1.z.string().optional().nullable(),
    assignedAuditor: zod_1.z.string({ message: 'Assigned auditor is required' }),
    startDate: zod_1.z.string({ message: 'Start date is required' }),
    endDate: zod_1.z.string().optional().nullable(),
    remarks: zod_1.z.string().max(500).optional().nullable(),
});
exports.verifyAssetSchema = zod_1.z.object({
    assetId: zod_1.z.string({ message: 'Asset is required' }),
    verificationStatus: zod_1.z.enum(['AVAILABLE', 'MISSING', 'DAMAGED', 'RETIRED'], { message: 'Verification status is required' }),
    condition: zod_1.z.enum(['EXCELLENT', 'GOOD', 'FAIR', 'POOR']).optional().nullable(),
    remarks: zod_1.z.string().max(500).optional().nullable(),
});
exports.completeAuditSchema = zod_1.z.object({
    remarks: zod_1.z.string().max(500).optional().nullable(),
});
