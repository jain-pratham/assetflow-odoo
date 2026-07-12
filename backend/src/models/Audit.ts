import mongoose, { Document, Schema } from 'mongoose';

export type AuditStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface IAudit extends Document {
  auditNumber: string;
  name: string;
  departmentId?: mongoose.Types.ObjectId;
  categoryId?: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  assignedAuditor: mongoose.Types.ObjectId;
  status: AuditStatus;
  startDate: Date;
  endDate?: Date;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AuditSchema = new Schema<IAudit>(
  {
    auditNumber: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department' },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    assignedAuditor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      default: 'OPEN',
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    remarks: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

AuditSchema.index({ status: 1 });
AuditSchema.index({ departmentId: 1 });

export default mongoose.model<IAudit>('Audit', AuditSchema);
