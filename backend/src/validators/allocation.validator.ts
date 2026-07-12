import { z } from 'zod';

export const allocateAssetSchema = z.object({
  assetId: z.string({ message: 'Asset is required' }),
  employeeId: z.string({ message: 'Employee is required' }),
  departmentId: z.string({ message: 'Department is required' }),
  allocatedAt: z.string().optional(),
  expectedReturnDate: z.string().optional().nullable(),
  remarks: z.string().max(500, 'Remarks cannot exceed 500 characters').optional().nullable(),
});

export const transferAssetSchema = z.object({
  newEmployeeId: z.string({ message: 'New employee is required' }),
  newDepartmentId: z.string({ message: 'New department is required' }),
  remarks: z.string().max(500, 'Remarks cannot exceed 500 characters').optional().nullable(),
});

export const returnAssetSchema = z.object({
  condition: z.enum(['EXCELLENT', 'GOOD', 'FAIR', 'POOR'], { message: 'Condition is required' }),
  remarks: z.string().max(500, 'Remarks cannot exceed 500 characters').optional().nullable(),
  returnedAt: z.string().optional(),
});
