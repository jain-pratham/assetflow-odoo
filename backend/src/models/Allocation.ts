import mongoose, { Document, Schema } from 'mongoose';

export interface IAllocation extends Document {
  assetId: mongoose.Types.ObjectId;
  employeeId: mongoose.Types.ObjectId;
  departmentId: mongoose.Types.ObjectId;
  allocatedBy: mongoose.Types.ObjectId;
  allocatedAt: Date;
  expectedReturnDate?: Date;
  returnedAt?: Date;
  status: 'ACTIVE' | 'RETURNED';
  remarks?: string;
  condition?: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  createdAt: Date;
  updatedAt: Date;
}

const AllocationSchema = new Schema<IAllocation>(
  {
    assetId: { type: Schema.Types.ObjectId, ref: 'Asset', required: true },
    employeeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
    allocatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    allocatedAt: { type: Date, default: Date.now, required: true },
    expectedReturnDate: { type: Date },
    returnedAt: { type: Date },
    status: { type: String, enum: ['ACTIVE', 'RETURNED'], default: 'ACTIVE' },
    remarks: { type: String, trim: true, maxlength: 500 },
    condition: { type: String, enum: ['EXCELLENT', 'GOOD', 'FAIR', 'POOR'] }
  },
  { timestamps: true }
);

// Allow only one active allocation per asset
AllocationSchema.index({ assetId: 1, status: 1 }, { unique: true, partialFilterExpression: { status: 'ACTIVE' } });

export default mongoose.model<IAllocation>('Allocation', AllocationSchema);
