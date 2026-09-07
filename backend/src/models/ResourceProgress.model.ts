import mongoose, { Schema, Document, Model } from 'mongoose';

export type ResourceProgressStatus = 'ACCESSED' | 'COMPLETED';

export interface IResourceProgress extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  resourceId: mongoose.Types.ObjectId;
  status: ResourceProgressStatus;
  accessCount: number;
  lastAccessedAt: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const resourceProgressSchema = new Schema<IResourceProgress>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    resourceId: {
      type: Schema.Types.ObjectId,
      ref: 'Resource',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['ACCESSED', 'COMPLETED'],
      default: 'ACCESSED',
      index: true,
    },
    accessCount: { type: Number, default: 1 },
    lastAccessedAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
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

resourceProgressSchema.index({ userId: 1, resourceId: 1 }, { unique: true });

export const ResourceProgress: Model<IResourceProgress> =
  mongoose.model<IResourceProgress>('ResourceProgress', resourceProgressSchema);
