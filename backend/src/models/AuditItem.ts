import mongoose, { Document, Schema } from 'mongoose';

export type VerificationStatus = 'PENDING' | 'AVAILABLE' | 'MISSING' | 'DAMAGED' | 'RETIRED';

export interface IAuditItem extends Document {
  auditId: mongoose.Types.ObjectId;
  assetId: mongoose.Types.ObjectId;
  verificationStatus: VerificationStatus;
  condition?: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  remarks?: string;
  verifiedBy?: mongoose.Types.ObjectId;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AuditItemSchema = new Schema<IAuditItem>(
  {
    auditId: { type: Schema.Types.ObjectId, ref: 'Audit', required: true },
    assetId: { type: Schema.Types.ObjectId, ref: 'Asset', required: true },
    verificationStatus: {
      type: String,
      enum: ['PENDING', 'AVAILABLE', 'MISSING', 'DAMAGED', 'RETIRED'],
      default: 'PENDING',
    },
    condition: { type: String, enum: ['EXCELLENT', 'GOOD', 'FAIR', 'POOR'] },
    remarks: { type: String, trim: true, maxlength: 500 },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: { type: Date },
  },
  { timestamps: true }
);

// Each asset can only appear once per audit
AuditItemSchema.index({ auditId: 1, assetId: 1 }, { unique: true });

export default mongoose.model<IAuditItem>('AuditItem', AuditItemSchema);
