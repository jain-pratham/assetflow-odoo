import mongoose, { Document, Schema } from 'mongoose';

export type MaintenancePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type MaintenanceStatus = 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface IMaintenance extends Document {
  requestId: string;
  assetId: mongoose.Types.ObjectId;
  categoryId: mongoose.Types.ObjectId;
  departmentId: mongoose.Types.ObjectId;
  reportedBy: mongoose.Types.ObjectId;
  assignedTechnicianId?: mongoose.Types.ObjectId;
  priority: MaintenancePriority;
  title: string;
  description: string;
  status: MaintenanceStatus;
  scheduledDate?: Date;
  completedDate?: Date;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MaintenanceSchema = new Schema<IMaintenance>(
  {
    requestId: { type: String, required: true, unique: true, trim: true, uppercase: true },
    assetId: { type: Schema.Types.ObjectId, ref: 'Asset', required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
    reportedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    assignedTechnicianId: { type: Schema.Types.ObjectId, ref: 'User' },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
      required: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, required: true, trim: true, maxlength: 1000 },
    status: {
      type: String,
      enum: ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      default: 'OPEN',
      required: true,
    },
    scheduledDate: { type: Date },
    completedDate: { type: Date },
    remarks: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

MaintenanceSchema.index({ requestId: 1 });
MaintenanceSchema.index({ assetId: 1, status: 1 });
MaintenanceSchema.index({ departmentId: 1, status: 1 });
MaintenanceSchema.index({ reportedBy: 1, status: 1 });
MaintenanceSchema.index({ assignedTechnicianId: 1, status: 1 });
MaintenanceSchema.index({ title: 'text', description: 'text', requestId: 'text' });

export default mongoose.model<IMaintenance>('Maintenance', MaintenanceSchema);
