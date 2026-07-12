import mongoose, { Document, Schema } from 'mongoose';

export interface IActivityLog extends Document {
  actor: mongoose.Types.ObjectId;
  action: string;
  target?: string;
  entityType?: string;
  entityId?: mongoose.Types.ObjectId | string;
  ipAddress?: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    actor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    target: { type: String },
    entityType: { type: String },
    entityId: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

ActivityLogSchema.index({ actor: 1 });
ActivityLogSchema.index({ createdAt: -1 });

export const ActivityLog = mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);
