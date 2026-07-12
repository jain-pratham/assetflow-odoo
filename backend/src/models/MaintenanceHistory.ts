import mongoose, { Document, Schema } from 'mongoose';

export type MaintenanceHistoryAction = 'CREATED' | 'ASSIGNED' | 'STARTED' | 'COMPLETED' | 'CANCELLED';

export interface IMaintenanceHistory extends Document {
  maintenanceId: mongoose.Types.ObjectId;
  assetId: mongoose.Types.ObjectId;
  action: MaintenanceHistoryAction;
  status: 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  performedBy: mongoose.Types.ObjectId;
  assignedTechnicianId?: mongoose.Types.ObjectId;
  remarks?: string;
  createdAt: Date;
}

const MaintenanceHistorySchema = new Schema<IMaintenanceHistory>(
  {
    maintenanceId: { type: Schema.Types.ObjectId, ref: 'Maintenance', required: true },
    assetId: { type: Schema.Types.ObjectId, ref: 'Asset', required: true },
    action: {
      type: String,
      enum: ['CREATED', 'ASSIGNED', 'STARTED', 'COMPLETED', 'CANCELLED'],
      required: true,
    },
    status: {
      type: String,
      enum: ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      required: true,
    },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    assignedTechnicianId: { type: Schema.Types.ObjectId, ref: 'User' },
    remarks: { type: String, trim: true, maxlength: 500 },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

MaintenanceHistorySchema.index({ maintenanceId: 1, createdAt: -1 });
MaintenanceHistorySchema.index({ assetId: 1, createdAt: -1 });
MaintenanceHistorySchema.set('strict', true);

export default mongoose.model<IMaintenanceHistory>('MaintenanceHistory', MaintenanceHistorySchema);
