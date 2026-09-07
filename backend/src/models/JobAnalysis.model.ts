import mongoose, { Schema, Document, Model } from 'mongoose';

export type JobAnalysisStatus = 'PENDING' | 'ANALYZING' | 'COMPLETED' | 'FAILED';

export interface IJobAnalysis extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  company?: string;
  source: string;
  rawDescription: string;
  status: JobAnalysisStatus;
  matchScore: number;
  matchedSkillsCount: number;
  missingSkillsCount: number;
  explanation?: string;
  createdAt: Date;
  updatedAt: Date;
}

const jobAnalysisSchema = new Schema<IJobAnalysis>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    company: { type: String, default: null, trim: true },
    source: { type: String, default: 'PASTED', trim: true },
    rawDescription: { type: String, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'ANALYZING', 'COMPLETED', 'FAILED'],
      default: 'PENDING',
      index: true,
    },
    matchScore: { type: Number, default: 0 },
    matchedSkillsCount: { type: Number, default: 0 },
    missingSkillsCount: { type: Number, default: 0 },
    explanation: { type: String, default: null },
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

jobAnalysisSchema.index({ userId: 1, createdAt: -1 });

export const JobAnalysis: Model<IJobAnalysis> = mongoose.model<IJobAnalysis>(
  'JobAnalysis',
  jobAnalysisSchema,
);
