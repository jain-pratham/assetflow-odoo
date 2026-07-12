import { z } from 'zod';

export const createAuditSchema = z.object({
  name: z.string({ message: 'Audit name is required' }).min(3).max(200),
  departmentId: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  assignedAuditor: z.string({ message: 'Assigned auditor is required' }),
  startDate: z.string({ message: 'Start date is required' }),
  endDate: z.string().optional().nullable(),
  remarks: z.string().max(500).optional().nullable(),
});

export const verifyAssetSchema = z.object({
  assetId: z.string({ message: 'Asset is required' }),
  verificationStatus: z.enum(['AVAILABLE', 'MISSING', 'DAMAGED', 'RETIRED'], { message: 'Verification status is required' }),
  condition: z.enum(['EXCELLENT', 'GOOD', 'FAIR', 'POOR']).optional().nullable(),
  remarks: z.string().max(500).optional().nullable(),
});

export const completeAuditSchema = z.object({
  remarks: z.string().max(500).optional().nullable(),
});
