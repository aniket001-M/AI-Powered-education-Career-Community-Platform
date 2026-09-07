import mongoose, { Schema, Document, Model } from 'mongoose';

export type InterviewEvaluationStatus = 'EVALUATION_PENDING' | 'EVALUATED';

export interface IInterviewResult extends Document {
  _id: mongoose.Types.ObjectId;
  sessionId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  status: InterviewEvaluationStatus;
  overallScore: number | null;
  feedback: string;
  strengths: string[];
  areasForImprovement: string[];
  evaluatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const interviewResultSchema = new Schema<IInterviewResult>(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'InterviewSession',
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['EVALUATION_PENDING', 'EVALUATED'],
      default: 'EVALUATION_PENDING',
      index: true,
    },
    overallScore: { type: Number, default: null },
    feedback: {
      type: String,
      default:
        'Interview responses have been recorded. Automated AI evaluation is not enabled in this deployment.',
    },
    strengths: [{ type: String }],
    areasForImprovement: [{ type: String }],
    evaluatedAt: { type: Date, default: null },
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

interviewResultSchema.index({ userId: 1, createdAt: -1 });

export const InterviewResult: Model<IInterviewResult> =
  mongoose.model<IInterviewResult>('InterviewResult', interviewResultSchema);
