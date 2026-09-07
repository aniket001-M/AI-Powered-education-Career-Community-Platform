import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOption {
  optionId: string;
  text: string;
}

export interface IAssessmentQuestion extends Document {
  _id: mongoose.Types.ObjectId;
  assessmentId: mongoose.Types.ObjectId;
  questionText: string;
  options: IOption[];
  correctOptionId: string;
  explanation?: string;
  skillId: mongoose.Types.ObjectId;
  topic: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  marks: number;
  createdAt: Date;
  updatedAt: Date;
}

const optionSchema = new Schema<IOption>(
  {
    optionId: { type: String, required: true },
    text: { type: String, required: true },
  },
  { _id: false },
);

const assessmentQuestionSchema = new Schema<IAssessmentQuestion>(
  {
    assessmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Assessment',
      required: true,
      index: true,
    },
    questionText: { type: String, required: true },
    options: [optionSchema],
    correctOptionId: { type: String, required: true, select: true },
    explanation: { type: String, default: null },
    skillId: {
      type: Schema.Types.ObjectId,
      ref: 'Skill',
      required: true,
      index: true,
    },
    topic: { type: String, required: true, trim: true, index: true },
    difficulty: {
      type: String,
      enum: ['EASY', 'MEDIUM', 'HARD'],
      default: 'MEDIUM',
    },
    marks: { type: Number, default: 1, min: 1 },
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

export const AssessmentQuestion: Model<IAssessmentQuestion> =
  mongoose.model<IAssessmentQuestion>(
    'AssessmentQuestion',
    assessmentQuestionSchema,
  );
