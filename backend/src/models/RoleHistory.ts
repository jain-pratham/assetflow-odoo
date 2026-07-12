import mongoose, { Document, Schema } from 'mongoose';
import { UserRole } from './User';

export interface IRoleHistory extends Document {
  employeeId: mongoose.Types.ObjectId;
  oldRole: UserRole;
  newRole: UserRole;
  changedBy: mongoose.Types.ObjectId;
  changedAt: Date;
}

const RoleHistorySchema = new Schema<IRoleHistory>(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    oldRole: { type: String, enum: Object.values(UserRole), required: true },
    newRole: { type: String, enum: Object.values(UserRole), required: true },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    changedAt: { type: Date, default: Date.now },
  }
);

export const RoleHistory = mongoose.model<IRoleHistory>('RoleHistory', RoleHistorySchema);
