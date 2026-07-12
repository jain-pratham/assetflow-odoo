"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCategorySchema = exports.createCategorySchema = void 0;
const zod_1 = require("zod");
exports.createCategorySchema = zod_1.z.object({
    name: zod_1.z
        .string({ required_error: 'Category name is required' })
        .min(1, 'Category name is required')
        .max(100, 'Category name cannot exceed 100 characters'),
    code: zod_1.z
        .string({ required_error: 'Category code is required' })
        .min(1, 'Category code is required')
        .max(20, 'Category code cannot exceed 20 characters')
        .transform((val) => val.toUpperCase()),
    description: zod_1.z
        .string()
        .max(500, 'Description cannot exceed 500 characters')
        .optional()
        .nullable(),
    defaultWarrantyMonths: zod_1.z
        .number()
        .min(0, 'Default warranty cannot be negative')
        .optional()
        .nullable(),
    status: zod_1.z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});
exports.updateCategorySchema = exports.createCategorySchema.partial();
