import mongoose, { Document, Schema } from 'mongoose';

export type AuditAction = 'CREATED' | 'VERIFIED' | 'UPDATED' | 'COMPLETED' | 'CANCELLED';

export interface IAuditHistory extends Document {
  auditId: mongoose.Types.ObjectId;
  assetId?: mongoose.Types.ObjectId;
  action: AuditAction;
  performedBy: mongoose.Types.ObjectId;
  remarks?: string;
  createdAt: Date;
}

const AuditHistorySchema = new Schema<IAuditHistory>(
  {
    auditId: { type: Schema.Types.ObjectId, ref: 'Audit', required: true },
    assetId: { type: Schema.Types.ObjectId, ref: 'Asset' },
    action: {
      type: String,
      enum: ['CREATED', 'VERIFIED', 'UPDATED', 'COMPLETED', 'CANCELLED'],
      required: true,
    },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    remarks: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.model<IAuditHistory>('AuditHistory', AuditHistorySchema);
