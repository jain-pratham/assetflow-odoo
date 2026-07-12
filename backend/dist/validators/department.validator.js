"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateDepartmentSchema = exports.createDepartmentSchema = void 0;
const zod_1 = require("zod");
exports.createDepartmentSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required').max(100, 'Name must be at most 100 characters'),
    code: zod_1.z.string().min(1, 'Code is required').max(20, 'Code must be at most 20 characters').transform(val => val.toUpperCase()),
    description: zod_1.z.string().max(500, 'Description must be at most 500 characters').optional().nullable(),
    headId: zod_1.z.string().optional().nullable(),
    status: zod_1.z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});
exports.updateDepartmentSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required').max(100, 'Name must be at most 100 characters').optional(),
    code: zod_1.z.string().min(1, 'Code is required').max(20, 'Code must be at most 20 characters').transform(val => val.toUpperCase()).optional(),
    description: zod_1.z.string().max(500, 'Description must be at most 500 characters').optional().nullable(),
    headId: zod_1.z.string().optional().nullable(),
    status: zod_1.z.enum(['ACTIVE', 'INACTIVE']).optional(),
});
