import mongoose, { Schema, Document, Model } from 'mongoose';

export type RoadmapStatus = 'ACTIVE' | 'ARCHIVED' | 'COMPLETED';

export interface IRoadmap extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  careerId: mongoose.Types.ObjectId;
  targetRole: string;
  version: number;
  status: RoadmapStatus;
  totalSteps: number;
  completedSteps: number;
  progressPercentage: number;
  generatedBy: 'RULE_BASED' | 'ML';
  createdAt: Date;
  updatedAt: Date;
}

const roadmapSchema = new Schema<IRoadmap>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    careerId: {
      type: Schema.Types.ObjectId,
      ref: 'Career',
      required: true,
      index: true,
    },
    targetRole: { type: String, required: true, trim: true },
    version: { type: Number, default: 1 },
    status: {
      type: String,
      enum: ['ACTIVE', 'ARCHIVED', 'COMPLETED'],
      default: 'ACTIVE',
      index: true,
    },
    totalSteps: { type: Number, default: 0 },
    completedSteps: { type: Number, default: 0 },
    progressPercentage: { type: Number, default: 0 },
    generatedBy: {
      type: String,
      enum: ['RULE_BASED', 'ML'],
      default: 'RULE_BASED',
    },
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

roadmapSchema.index({ userId: 1, status: 1 });

export const Roadmap: Model<IRoadmap> = mongoose.model<IRoadmap>(
  'Roadmap',
  roadmapSchema,
);
