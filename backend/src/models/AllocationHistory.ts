import mongoose, { Document, Schema } from 'mongoose';

export interface IAllocationHistory extends Document {
  allocationId: mongoose.Types.ObjectId;
  assetId: mongoose.Types.ObjectId;
  action: 'ALLOCATED' | 'TRANSFERRED' | 'RETURNED';
  oldEmployeeId?: mongoose.Types.ObjectId;
  newEmployeeId?: mongoose.Types.ObjectId;
  oldDepartmentId?: mongoose.Types.ObjectId;
  newDepartmentId?: mongoose.Types.ObjectId;
  performedBy: mongoose.Types.ObjectId;
  condition?: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  remarks?: string;
  createdAt: Date;
}

const AllocationHistorySchema = new Schema<IAllocationHistory>(
  {
    allocationId: { type: Schema.Types.ObjectId, ref: 'Allocation', required: true },
    assetId: { type: Schema.Types.ObjectId, ref: 'Asset', required: true },
    action: { type: String, enum: ['ALLOCATED', 'TRANSFERRED', 'RETURNED'], required: true },
    oldEmployeeId: { type: Schema.Types.ObjectId, ref: 'User' },
    newEmployeeId: { type: Schema.Types.ObjectId, ref: 'User' },
    oldDepartmentId: { type: Schema.Types.ObjectId, ref: 'Department' },
    newDepartmentId: { type: Schema.Types.ObjectId, ref: 'Department' },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    condition: { type: String, enum: ['EXCELLENT', 'GOOD', 'FAIR', 'POOR'] },
    remarks: { type: String, trim: true, maxlength: 500 }
  },
  { timestamps: { createdAt: true, updatedAt: false } } // Immutable history
);

export default mongoose.model<IAllocationHistory>('AllocationHistory', AllocationHistorySchema);
