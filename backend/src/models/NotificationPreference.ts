import mongoose, { Document, Schema } from 'mongoose';

export interface INotificationPreference extends Document {
  user: mongoose.Types.ObjectId;
  enableEmail: boolean;
  enableBrowser: boolean;
  enableSound: boolean;
  enablePush: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationPreferenceSchema = new Schema<INotificationPreference>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    enableEmail: { type: Boolean, default: true },
    enableBrowser: { type: Boolean, default: true },
    enableSound: { type: Boolean, default: true },
    enablePush: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const NotificationPreference = mongoose.model<INotificationPreference>('NotificationPreference', NotificationPreferenceSchema);
