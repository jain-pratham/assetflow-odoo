import mongoose, { Document, Schema } from 'mongoose';

export interface IAsset extends Document {
  name: string;
  tag: string;
  serialNumber: string;
  category: mongoose.Types.ObjectId;
  department: mongoose.Types.ObjectId;
  assignedTo?: mongoose.Types.ObjectId;
  purchaseDate?: Date;
  purchaseCost?: number;
  vendor?: string;
  warrantyMonths?: number;
  condition: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  status: 'AVAILABLE' | 'ALLOCATED' | 'MAINTENANCE' | 'RETIRED';
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AssetSchema = new Schema<IAsset>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    tag: { type: String, required: true, unique: true, trim: true, uppercase: true, maxlength: 50 },
    serialNumber: { type: String, required: true, trim: true, maxlength: 100 },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    department: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    purchaseDate: { type: Date },
    purchaseCost: { type: Number, min: 0 },
    vendor: { type: String, trim: true, maxlength: 100 },
    warrantyMonths: { type: Number, min: 0, default: 0 },
    condition: { 
      type: String, 
      enum: ['EXCELLENT', 'GOOD', 'FAIR', 'POOR'], 
      default: 'GOOD',
      required: true 
    },
    status: { 
      type: String, 
      enum: ['AVAILABLE', 'ALLOCATED', 'MAINTENANCE', 'RETIRED'], 
      default: 'AVAILABLE',
      required: true 
    },
    description: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

AssetSchema.index({ name: 'text', tag: 'text', serialNumber: 'text', vendor: 'text' });

export default mongoose.model<IAsset>('Asset', AssetSchema);
