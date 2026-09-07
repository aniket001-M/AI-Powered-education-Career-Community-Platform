import mongoose, { Schema, Document, Model } from 'mongoose';

export type AttemptStatus = 'IN_PROGRESS' | 'SUBMITTED' | 'ABANDONED';

export interface IAssessmentAttempt extends Document {
  _id: mongoose.Types.ObjectId;
  assessmentId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  startedAt: Date;
  submittedAt?: Date;
  status: AttemptStatus;
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const assessmentAttemptSchema = new Schema<IAssessmentAttempt>(
  {
    assessmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Assessment',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ['IN_PROGRESS', 'SUBMITTED', 'ABANDONED'],
      default: 'IN_PROGRESS',
      index: true,
    },
    score: { type: Number, default: 0 },
    maxScore: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    passed: { type: Boolean, default: false },
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

assessmentAttemptSchema.index({ userId: 1, assessmentId: 1, status: 1 });

export const AssessmentAttempt: Model<IAssessmentAttempt> =
  mongoose.model<IAssessmentAttempt>(
    'AssessmentAttempt',
    assessmentAttemptSchema,
  );
