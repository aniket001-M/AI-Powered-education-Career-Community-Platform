import mongoose, { Schema, Document, Model } from 'mongoose';

export type StepStatus =
  | 'LOCKED'
  | 'AVAILABLE'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'SKIPPED';

export interface IRoadmapStep extends Document {
  _id: mongoose.Types.ObjectId;
  roadmapId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  skillId: mongoose.Types.ObjectId;
  stepOrder: number;
  title: string;
  description: string;
  status: StepStatus;
  currentProficiency: number;
  targetProficiency: number;
  prerequisiteStepIds: mongoose.Types.ObjectId[];
  estimatedHours: number;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const roadmapStepSchema = new Schema<IRoadmapStep>(
  {
    roadmapId: {
      type: Schema.Types.ObjectId,
      ref: 'Roadmap',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    skillId: {
      type: Schema.Types.ObjectId,
      ref: 'Skill',
      required: true,
      index: true,
    },
    stepOrder: { type: Number, required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    status: {
      type: String,
      enum: ['LOCKED', 'AVAILABLE', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED'],
      default: 'LOCKED',
      index: true,
    },
    currentProficiency: { type: Number, default: 0 },
    targetProficiency: { type: Number, default: 3 },
    prerequisiteStepIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'RoadmapStep',
      },
    ],
    estimatedHours: { type: Number, default: 20 },
    startedAt: { type: Date, default: null },
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

roadmapStepSchema.index({ roadmapId: 1, stepOrder: 1 });

export const RoadmapStep: Model<IRoadmapStep> = mongoose.model<IRoadmapStep>(
  'RoadmapStep',
  roadmapStepSchema,
);
