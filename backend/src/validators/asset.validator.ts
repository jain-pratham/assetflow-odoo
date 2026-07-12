import { z } from 'zod';

export const createAssetSchema = z.object({
  name: z.string({ required_error: 'Asset name is required' }).min(1).max(100),
  tag: z.string({ required_error: 'Asset tag is required' }).min(1).max(50).transform(val => val.toUpperCase()),
  serialNumber: z.string({ required_error: 'Serial number is required' }).min(1).max(100),
  category: z.string({ required_error: 'Category is required' }),
  department: z.string({ required_error: 'Department is required' }),
  assignedTo: z.string().optional().nullable(),
  purchaseDate: z.string().optional().nullable(),
  purchaseCost: z.number().min(0, 'Cost cannot be negative').optional().nullable(),
  vendor: z.string().max(100).optional().nullable(),
  warrantyMonths: z.number().min(0).default(0),
  condition: z.enum(['EXCELLENT', 'GOOD', 'FAIR', 'POOR']).default('GOOD'),
  status: z.enum(['AVAILABLE', 'ALLOCATED', 'MAINTENANCE', 'RETIRED']).default('AVAILABLE'),
  description: z.string().max(500).optional().nullable(),
});

export const updateAssetSchema = createAssetSchema.partial();
