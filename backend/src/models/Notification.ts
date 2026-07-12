import mongoose, { Document, Schema } from 'mongoose';

export type NotificationType =
  | 'SYSTEM'
  | 'USER'
  | 'ASSET'
  | 'BOOKING'
  | 'TRANSFER'
  | 'ALLOCATION'
  | 'RETURN'
  | 'MAINTENANCE'
  | 'AUDIT'
  | 'ROLE'
  | 'DEPARTMENT'
  | 'CATEGORY'
  | 'REPORT'
  | 'SECURITY';

export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface INotification extends Document {
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  recipient: mongoose.Types.ObjectId;
  sender?: mongoose.Types.ObjectId;
  entityType?: string;
  entityId?: mongoose.Types.ObjectId | string;
  actionUrl?: string;
  isRead: boolean;
  readAt?: Date;
  emailSent: boolean;
  emailSentAt?: Date;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, required: true },
    priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'LOW' },
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User' },
    entityType: { type: String },
    entityId: { type: Schema.Types.Mixed },
    actionUrl: { type: String },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
    emailSent: { type: Boolean, default: false },
    emailSentAt: { type: Date },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

NotificationSchema.index({ recipient: 1, isRead: 1 });
NotificationSchema.index({ createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
