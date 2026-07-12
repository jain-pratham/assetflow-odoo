"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAssetSchema = exports.createAssetSchema = void 0;
const zod_1 = require("zod");
exports.createAssetSchema = zod_1.z.object({
    name: zod_1.z.string({ message: 'Asset name is required' }).min(1).max(100),
    tag: zod_1.z.string({ message: 'Asset tag is required' }).min(1).max(50).transform(val => val.toUpperCase()),
    serialNumber: zod_1.z.string({ message: 'Serial number is required' }).min(1).max(100),
    category: zod_1.z.string({ message: 'Category is required' }),
    department: zod_1.z.string({ message: 'Department is required' }),
    assignedTo: zod_1.z.string().optional().nullable(),
    purchaseDate: zod_1.z.string().optional().nullable(),
    purchaseCost: zod_1.z.number().min(0, 'Cost cannot be negative').optional().nullable(),
    vendor: zod_1.z.string().max(100).optional().nullable(),
    warrantyMonths: zod_1.z.number().min(0).default(0),
    condition: zod_1.z.enum(['EXCELLENT', 'GOOD', 'FAIR', 'POOR']).default('GOOD'),
    status: zod_1.z.enum(['AVAILABLE', 'ALLOCATED', 'MAINTENANCE', 'RETIRED']).default('AVAILABLE'),
    description: zod_1.z.string().max(500).optional().nullable(),
});
exports.updateAssetSchema = exports.createAssetSchema.partial();
