import { z } from 'zod';

export const createDepartmentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be at most 100 characters'),
  code: z.string().min(1, 'Code is required').max(20, 'Code must be at most 20 characters').transform(val => val.toUpperCase()),
  description: z.string().max(500, 'Description must be at most 500 characters').optional().nullable(),
  headId: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

export const updateDepartmentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be at most 100 characters').optional(),
  code: z.string().min(1, 'Code is required').max(20, 'Code must be at most 20 characters').transform(val => val.toUpperCase()).optional(),
  description: z.string().max(500, 'Description must be at most 500 characters').optional().nullable(),
  headId: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});
