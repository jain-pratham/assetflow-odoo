import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Booking from '../models/Booking';
import BookingHistory from '../models/BookingHistory';
import Asset from '../models/Asset';
import { createBookingSchema, approveRejectBookingSchema, cancelBookingSchema } from '../validators/booking.validator';
import { successResponse, errorResponse } from '../utils/apiResponse';
import { UserRole } from '../models/User';

// Helper: convert "HH:MM" to total minutes from midnight
function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

// Helper: check if two time ranges overlap
function timesOverlap(s1: string, e1: string, s2: string, e2: string): boolean {
  const start1 = timeToMinutes(s1);
  const end1 = timeToMinutes(e1);
  const start2 = timeToMinutes(s2);
  const end2 = timeToMinutes(e2);
  return start1 < end2 && start2 < end1;
}

// Helper: RBAC filter for reading bookings
function getRbacQuery(user: any) {
  const role = user.role as UserRole;
  if (role === UserRole.ADMIN || role === UserRole.ASSET_MANAGER) return {};
  if (role === UserRole.DEPARTMENT_HEAD) return { departmentId: user.departmentId };
  return { employeeId: user._id };
}

export class BookingController {

  static getStats = async (req: Request, res: Response) => {
    try {
      const baseQuery = getRbacQuery(req.user);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const [
        totalResources,
        availableResources,
        todaysBookings,
        pendingRequests,
        approvedBookings,
        rejectedBookings,
      ] = await Promise.all([
        Asset.countDocuments(),
        Asset.countDocuments({ status: 'AVAILABLE' }),
        Booking.countDocuments({ ...baseQuery, bookingDate: { $gte: today, $lt: tomorrow } }),
        Booking.countDocuments({ ...baseQuery, status: 'PENDING' }),
        Booking.countDocuments({ ...baseQuery, status: 'APPROVED' }),
        Booking.countDocuments({ ...baseQuery, status: 'REJECTED' }),
      ]);

      return res.status(200).json(successResponse('Booking stats retrieved', {
        totalResources,
        availableResources,
        todaysBookings,
        pendingRequests,
        approvedBookings,
        rejectedBookings,
      }));
    } catch (error) {
      console.error('Get booking stats error:', error);
      return res.status(500).json(errorResponse('Failed to fetch booking stats'));
    }
  };

  static getBookings = async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const query: any = { ...getRbacQuery(req.user) };

      if (req.query.status) query.status = req.query.status;
      if (req.query.departmentId) query.departmentId = req.query.departmentId;
      if (req.query.categoryId) query.categoryId = req.query.categoryId;
      if (req.query.search) {
        query.$or = [
          { purpose: { $regex: req.query.search, $options: 'i' } },
        ];
      }
      if (req.query.dateFrom || req.query.dateTo) {
        query.bookingDate = {};
        if (req.query.dateFrom) query.bookingDate.$gte = new Date(req.query.dateFrom as string);
        if (req.query.dateTo) {
          const to = new Date(req.query.dateTo as string);
          to.setHours(23, 59, 59, 999);
          query.bookingDate.$lte = to;
        }
      }

      const total = await Booking.countDocuments(query);
      const bookings = await Booking.find(query)
        .populate('resourceId', 'name tag')
        .populate('categoryId', 'name code')
        .populate('employeeId', 'firstName lastName email')
        .populate('departmentId', 'name')
        .populate('approvedBy', 'firstName lastName')
        .sort({ bookingDate: -1, startTime: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      return res.status(200).json(successResponse('Bookings retrieved', bookings, {
        total, page, pages: Math.ceil(total / limit) || 1,
      }));
    } catch (error) {
      return res.status(500).json(errorResponse('Failed to fetch bookings'));
    }
  };

  static getHistory = async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const query: any = {};
      // For EMPLOYEE, filter by their own bookings via bookingId lookup
      // For DEPT_HEAD, filter by their department
      // This is done via a join — use aggregation for role-scoped history

      const role = req.user!.role as UserRole;
      if (role === UserRole.EMPLOYEE) {
        // get all bookingIds for this employee
        const empBookings = await Booking.find({ employeeId: req.user!._id }).select('_id').lean();
        query.bookingId = { $in: empBookings.map(b => b._id) };
      } else if (role === UserRole.DEPARTMENT_HEAD) {
        const deptBookings = await Booking.find({ departmentId: req.user!.departmentId }).select('_id').lean();
        query.bookingId = { $in: deptBookings.map(b => b._id) };
      }

      const total = await BookingHistory.countDocuments(query);
      const history = await BookingHistory.find(query)
        .populate('bookingId', 'bookingDate startTime endTime purpose status')
        .populate('resourceId', 'name tag')
        .populate('performedBy', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      return res.status(200).json(successResponse('Booking history retrieved', history, {
        total, page, pages: Math.ceil(total / limit) || 1,
      }));
    } catch (error) {
      return res.status(500).json(errorResponse('Failed to fetch booking history'));
    }
  };

  static getCalendar = async (req: Request, res: Response) => {
    try {
      const query: any = { ...getRbacQuery(req.user) };

      // Optional date range filter
      if (req.query.dateFrom || req.query.dateTo) {
        query.bookingDate = {};
        if (req.query.dateFrom) query.bookingDate.$gte = new Date(req.query.dateFrom as string);
        if (req.query.dateTo) {
          const to = new Date(req.query.dateTo as string);
          to.setHours(23, 59, 59, 999);
          query.bookingDate.$lte = to;
        }
      }

      const bookings = await Booking.find(query)
        .populate('resourceId', 'name tag')
        .populate('employeeId', 'firstName lastName')
        .populate('departmentId', 'name')
        .sort({ bookingDate: 1, startTime: 1 })
        .lean();

      // Map to calendar event format
      const events = bookings.map((b: any) => ({
        id: b._id,
        title: `${(b.resourceId as any)?.name || 'Resource'} — ${(b.employeeId as any)?.firstName} ${(b.employeeId as any)?.lastName}`,
        date: b.bookingDate,
        startTime: b.startTime,
        endTime: b.endTime,
        status: b.status,
        purpose: b.purpose,
        resource: b.resourceId,
        employee: b.employeeId,
        department: b.departmentId,
      }));

      return res.status(200).json(successResponse('Calendar events retrieved', events));
    } catch (error) {
      return res.status(500).json(errorResponse('Failed to fetch calendar data'));
    }
  };

  static getById = async (req: Request, res: Response) => {
    try {
      const booking = await Booking.findById(req.params.id)
        .populate('resourceId', 'name tag serialNumber')
        .populate('categoryId', 'name code')
        .populate('employeeId', 'firstName lastName email')
        .populate('departmentId', 'name')
        .populate('approvedBy', 'firstName lastName')
        .lean();

      if (!booking) return res.status(404).json(errorResponse('Booking not found'));

      // RBAC: Employee can only view their own
      const role = req.user!.role as UserRole;
      if (role === UserRole.EMPLOYEE && (booking as any).employeeId?._id?.toString() !== req.user!._id.toString()) {
        return res.status(403).json(errorResponse('Access denied'));
      }
      if (role === UserRole.DEPARTMENT_HEAD && (booking as any).departmentId?._id?.toString() !== req.user!.departmentId?.toString()) {
        return res.status(403).json(errorResponse('Access denied'));
      }

      return res.status(200).json(successResponse('Booking retrieved', booking));
    } catch (error) {
      return res.status(500).json(errorResponse('Failed to fetch booking'));
    }
  };

  static createBooking = async (req: Request, res: Response) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const validatedData = createBookingSchema.parse(req.body);

      // RBAC: DEPT_HEAD can only book for their department
      if (req.user!.role === UserRole.DEPARTMENT_HEAD && validatedData.departmentId !== req.user!.departmentId?.toString()) {
        throw new Error('You can only book resources for your own department');
      }

      // Validate time logic
      const startMin = timeToMinutes(validatedData.startTime);
      const endMin = timeToMinutes(validatedData.endTime);
      if (endMin <= startMin) throw new Error('End time must be after start time');

      const duration = endMin - startMin;

      // Check resource exists and is available for booking
      const resource = await Asset.findById(validatedData.resourceId).session(session);
      if (!resource) throw new Error('Resource not found');

      // Check for overlapping APPROVED bookings on same date
      const bookingDate = new Date(validatedData.bookingDate);
      bookingDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(bookingDate);
      nextDay.setDate(nextDay.getDate() + 1);

      const existingBookings = await Booking.find({
        resourceId: validatedData.resourceId,
        bookingDate: { $gte: bookingDate, $lt: nextDay },
        status: { $in: ['PENDING', 'APPROVED'] },
      }).session(session).lean();

      for (const eb of existingBookings) {
        if (timesOverlap(validatedData.startTime, validatedData.endTime, eb.startTime, eb.endTime)) {
          throw new Error(`Resource is already booked from ${eb.startTime} to ${eb.endTime} on that date`);
        }
      }

      // Create booking
      const [booking] = await Booking.create([{
        resourceId: validatedData.resourceId,
        categoryId: validatedData.categoryId,
        employeeId: validatedData.employeeId,
        departmentId: validatedData.departmentId,
        purpose: validatedData.purpose,
        remarks: validatedData.remarks,
        bookingDate: new Date(validatedData.bookingDate),
        startTime: validatedData.startTime,
        endTime: validatedData.endTime,
        duration,
        status: 'PENDING',
      }] as any, { session });

      // Create history
      await BookingHistory.create([{
        bookingId: booking._id,
        resourceId: validatedData.resourceId,
        action: 'CREATED',
        performedBy: req.user!._id,
        remarks: validatedData.remarks,
      }] as any, { session });

      await session.commitTransaction();

      const populated = await Booking.findById(booking._id)
        .populate('resourceId', 'name tag')
        .populate('categoryId', 'name')
        .populate('employeeId', 'firstName lastName')
        .populate('departmentId', 'name')
        .lean();

      return res.status(201).json(successResponse('Booking request created successfully', populated));
    } catch (error: any) {
      await session.abortTransaction();
      if (error.name === 'ZodError') {
        const issues = (error as any).errors || (error as any).issues || [];
        return res.status(400).json(errorResponse(issues[0]?.message || 'Validation failed'));
      }
      return res.status(400).json(errorResponse(error.message || 'Failed to create booking'));
    } finally {
      session.endSession();
    }
  };

  static approveBooking = async (req: Request, res: Response) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const booking = await Booking.findById(req.params.id).session(session);
      if (!booking) throw new Error('Booking not found');
      if (booking.status !== 'PENDING') throw new Error('Only pending bookings can be approved');

      const validatedData = approveRejectBookingSchema.parse(req.body);

      booking.status = 'APPROVED';
      booking.approvedBy = new mongoose.Types.ObjectId(req.user!._id.toString());
      booking.approvedAt = new Date();
      await booking.save({ session });

      await BookingHistory.create([{
        bookingId: booking._id,
        resourceId: booking.resourceId,
        action: 'APPROVED',
        performedBy: req.user!._id,
        remarks: validatedData.remarks,
      }] as any, { session });

      await session.commitTransaction();
      return res.status(200).json(successResponse('Booking approved successfully', booking));
    } catch (error: any) {
      await session.abortTransaction();
      return res.status(400).json(errorResponse(error.message || 'Failed to approve booking'));
    } finally {
      session.endSession();
    }
  };

  static rejectBooking = async (req: Request, res: Response) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const booking = await Booking.findById(req.params.id).session(session);
      if (!booking) throw new Error('Booking not found');
      if (booking.status !== 'PENDING') throw new Error('Only pending bookings can be rejected');

      const validatedData = approveRejectBookingSchema.parse(req.body);

      booking.status = 'REJECTED';
      await booking.save({ session });

      await BookingHistory.create([{
        bookingId: booking._id,
        resourceId: booking.resourceId,
        action: 'REJECTED',
        performedBy: req.user!._id,
        remarks: validatedData.remarks,
      }] as any, { session });

      await session.commitTransaction();
      return res.status(200).json(successResponse('Booking rejected', booking));
    } catch (error: any) {
      await session.abortTransaction();
      return res.status(400).json(errorResponse(error.message || 'Failed to reject booking'));
    } finally {
      session.endSession();
    }
  };

  static cancelBooking = async (req: Request, res: Response) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const booking = await Booking.findById(req.params.id).session(session);
      if (!booking) throw new Error('Booking not found');
      if (booking.status !== 'PENDING' && booking.status !== 'APPROVED') {
        throw new Error('Only pending or approved bookings can be cancelled');
      }

      const validatedData = cancelBookingSchema.parse(req.body);

      // RBAC: Employee can only cancel their own pending bookings
      const role = req.user!.role as UserRole;
      if (role === UserRole.EMPLOYEE) {
        if (booking.employeeId.toString() !== req.user!._id.toString()) {
          throw new Error('You can only cancel your own bookings');
        }
        if (booking.status !== 'PENDING') {
          throw new Error('Employees can only cancel pending bookings');
        }
      }
      if (role === UserRole.DEPARTMENT_HEAD) {
        if (booking.departmentId.toString() !== req.user!.departmentId?.toString()) {
          throw new Error('You can only cancel bookings from your department');
        }
      }

      booking.status = 'CANCELLED';
      await booking.save({ session });

      await BookingHistory.create([{
        bookingId: booking._id,
        resourceId: booking.resourceId,
        action: 'CANCELLED',
        performedBy: req.user!._id,
        remarks: validatedData.remarks,
      }] as any, { session });

      await session.commitTransaction();
      return res.status(200).json(successResponse('Booking cancelled', booking));
    } catch (error: any) {
      await session.abortTransaction();
      return res.status(400).json(errorResponse(error.message || 'Failed to cancel booking'));
    } finally {
      session.endSession();
    }
  };
}
