import mongoose, { Document, Schema } from 'mongoose';

export type BookingHistoryAction = 'CREATED' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface IBookingHistory extends Document {
  bookingId: mongoose.Types.ObjectId;
  resourceId: mongoose.Types.ObjectId;
  action: BookingHistoryAction;
  performedBy: mongoose.Types.ObjectId;
  remarks?: string;
  createdAt: Date;
}

const BookingHistorySchema = new Schema<IBookingHistory>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
    resourceId: { type: Schema.Types.ObjectId, ref: 'Asset', required: true },
    action: {
      type: String,
      enum: ['CREATED', 'APPROVED', 'REJECTED', 'CANCELLED'],
      required: true,
    },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    remarks: { type: String, trim: true, maxlength: 500 },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Immutable - no updates
BookingHistorySchema.set('strict', true);

export default mongoose.model<IBookingHistory>('BookingHistory', BookingHistorySchema);
