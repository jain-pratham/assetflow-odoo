import { z } from 'zod';

export const createMaintenanceSchema = z.object({
  assetId: z.string({ message: 'Asset is required' }).min(1, 'Asset is required'),
  categoryId: z.string({ message: 'Category is required' }).min(1, 'Category is required'),
  departmentId: z.string({ message: 'Department is required' }).min(1, 'Department is required'),
  reportedBy: z.string({ message: 'Reported by is required' }).min(1, 'Reported by is required'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  title: z.string({ message: 'Issue title is required' }).min(3, 'Issue title must be at least 3 characters').max(150),
  description: z.string({ message: 'Issue description is required' }).min(5, 'Issue description must be at least 5 characters').max(1000),
  scheduledDate: z.string().optional().nullable(),
  remarks: z.string().max(500).optional().nullable(),
});

export const assignMaintenanceSchema = z.object({
  assignedTechnicianId: z.string({ message: 'Technician is required' }).min(1, 'Technician is required'),
  assignmentDate: z.string().optional().nullable(),
  scheduledDate: z.string({ message: 'Expected completion is required' }).min(1, 'Expected completion is required'),
  remarks: z.string().max(500).optional().nullable(),
});

export const updateMaintenanceStatusSchema = z.object({
  status: z.enum(['IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  remarks: z.string().max(500).optional().nullable(),
});
