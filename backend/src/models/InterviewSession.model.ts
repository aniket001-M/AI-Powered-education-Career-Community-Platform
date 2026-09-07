import mongoose, { Schema, Document, Model } from 'mongoose';

export type InterviewDifficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type InterviewSessionStatus = 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';

export interface IInterviewSession extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  careerId: mongoose.Types.ObjectId;
  roleTitle: string;
  difficulty: InterviewDifficulty;
  status: InterviewSessionStatus;
  questionsCount: number;
  answeredCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const interviewSessionSchema = new Schema<IInterviewSession>(
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
    roleTitle: { type: String, required: true, trim: true },
    difficulty: {
      type: String,
      enum: ['EASY', 'MEDIUM', 'HARD'],
      default: 'MEDIUM',
    },
    status: {
      type: String,
      enum: ['IN_PROGRESS', 'COMPLETED', 'ABANDONED'],
      default: 'IN_PROGRESS',
      index: true,
    },
    questionsCount: { type: Number, default: 0 },
    answeredCount: { type: Number, default: 0 },
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

interviewSessionSchema.index({ userId: 1, createdAt: -1 });

export const InterviewSession: Model<IInterviewSession> =
  mongoose.model<IInterviewSession>('InterviewSession', interviewSessionSchema);
