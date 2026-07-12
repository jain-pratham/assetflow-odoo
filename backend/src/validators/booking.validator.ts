import { z } from 'zod';

export const createBookingSchema = z.object({
  resourceId: z.string({ message: 'Resource is required' }),
  categoryId: z.string({ message: 'Category is required' }),
  departmentId: z.string({ message: 'Department is required' }),
  employeeId: z.string({ message: 'Employee is required' }),
  bookingDate: z.string({ message: 'Booking date is required' }),
  startTime: z.string({ message: 'Start time is required' }).regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)'),
  endTime: z.string({ message: 'End time is required' }).regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)'),
  purpose: z.string({ message: 'Purpose is required' }).min(3, 'Purpose must be at least 3 characters').max(500),
  remarks: z.string().max(500).optional().nullable(),
});

export const approveRejectBookingSchema = z.object({
  remarks: z.string().max(500).optional().nullable(),
});

export const cancelBookingSchema = z.object({
  remarks: z.string().max(500).optional().nullable(),
});
