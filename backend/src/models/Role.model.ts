import mongoose, { Schema, Document, Model } from 'mongoose';
import { UserRole, ALL_ROLES } from '@/common/enums/roles.enum';

export interface IRole extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: UserRole;
  isPrimary: boolean;
  assignedAt: Date;
  assignedBy?: mongoose.Types.ObjectId;
}

const roleSchema = new Schema<IRole>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ALL_ROLES,
      required: true,
    },
    isPrimary: {
      type: Boolean,
      default: true,
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: false,
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
        ret.id = ret._id ? ret._id.toString() : undefined;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

// Prevent duplicate role assignment per user
roleSchema.index({ userId: 1, role: 1 }, { unique: true });

export const Role: Model<IRole> = mongoose.model<IRole>('Role', roleSchema);
