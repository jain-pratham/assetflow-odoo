import mongoose, { Document, Schema } from 'mongoose';

export type BookingStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface IBooking extends Document {
  resourceId: mongoose.Types.ObjectId;
  categoryId: mongoose.Types.ObjectId;
  employeeId: mongoose.Types.ObjectId;
  departmentId: mongoose.Types.ObjectId;
  purpose: string;
  remarks?: string;
  bookingDate: Date;
  startTime: string; // "HH:MM" 24h format
  endTime: string;   // "HH:MM" 24h format
  duration: number;  // in minutes
  status: BookingStatus;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    resourceId: { type: Schema.Types.ObjectId, ref: 'Asset', required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    employeeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
    purpose: { type: String, required: true, trim: true, maxlength: 500 },
    remarks: { type: String, trim: true, maxlength: 500 },
    bookingDate: { type: Date, required: true },
    startTime: { type: String, required: true }, // "09:00"
    endTime: { type: String, required: true },   // "10:00"
    duration: { type: Number, required: true, min: 1 }, // minutes
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'],
      default: 'PENDING',
      required: true,
    },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
  },
  { timestamps: true }
);

// Index for overlap checking
BookingSchema.index({ resourceId: 1, bookingDate: 1, status: 1 });
BookingSchema.index({ employeeId: 1, bookingDate: 1 });
BookingSchema.index({ departmentId: 1, bookingDate: 1 });

export default mongoose.model<IBooking>('Booking', BookingSchema);
