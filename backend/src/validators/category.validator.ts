import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z
    .string({ message: 'Category name is required' })
    .min(1, 'Category name is required')
    .max(100, 'Category name cannot exceed 100 characters'),
  code: z
    .string({ message: 'Category code is required' })
    .min(1, 'Category code is required')
    .max(20, 'Category code cannot exceed 20 characters')
    .transform((val) => val.toUpperCase()),
  description: z
    .string()
    .max(500, 'Description cannot exceed 500 characters')
    .optional()
    .nullable(),
  defaultWarrantyMonths: z
    .number()
    .min(0, 'Default warranty cannot be negative')
    .optional()
    .nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

export const updateCategorySchema = createCategorySchema.partial();
