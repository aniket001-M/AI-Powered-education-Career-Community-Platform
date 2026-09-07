import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITopicPerformance {
  topic: string;
  score: number;
  maxScore: number;
  percentage: number;
}

export interface ISkillPerformance {
  skillId: mongoose.Types.ObjectId;
  skillName: string;
  score: number;
  maxScore: number;
  percentage: number;
}

export interface IWeakArea {
  skillId: mongoose.Types.ObjectId;
  skillName: string;
  topic: string;
  percentage: number;
}

export interface IAssessmentResult extends Document {
  _id: mongoose.Types.ObjectId;
  attemptId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  assessmentId: mongoose.Types.ObjectId;
  totalScore: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  topicPerformance: ITopicPerformance[];
  skillPerformance: ISkillPerformance[];
  weakAreas: IWeakArea[];
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const assessmentResultSchema = new Schema<IAssessmentResult>(
  {
    attemptId: {
      type: Schema.Types.ObjectId,
      ref: 'AssessmentAttempt',
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
    assessmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Assessment',
      required: true,
      index: true,
    },
    totalScore: { type: Number, required: true },
    maxScore: { type: Number, required: true },
    percentage: { type: Number, required: true },
    passed: { type: Boolean, required: true },
    topicPerformance: [
      {
        topic: { type: String, required: true },
        score: { type: Number, required: true },
        maxScore: { type: Number, required: true },
        percentage: { type: Number, required: true },
      },
    ],
    skillPerformance: [
      {
        skillId: { type: Schema.Types.ObjectId, ref: 'Skill', required: true },
        skillName: { type: String, required: true },
        score: { type: Number, required: true },
        maxScore: { type: Number, required: true },
        percentage: { type: Number, required: true },
      },
    ],
    weakAreas: [
      {
        skillId: { type: Schema.Types.ObjectId, ref: 'Skill', required: true },
        skillName: { type: String, required: true },
        topic: { type: String, required: true },
        percentage: { type: Number, required: true },
      },
    ],
    submittedAt: { type: Date, default: Date.now },
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

export const AssessmentResult: Model<IAssessmentResult> =
  mongoose.model<IAssessmentResult>(
    'AssessmentResult',
    assessmentResultSchema,
  );
