import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAssessmentAnswer extends Document {
  _id: mongoose.Types.ObjectId;
  attemptId: mongoose.Types.ObjectId;
  questionId: mongoose.Types.ObjectId;
  selectedOptionId: string;
  isCorrect?: boolean;
  marksAwarded: number;
  createdAt: Date;
  updatedAt: Date;
}

const assessmentAnswerSchema = new Schema<IAssessmentAnswer>(
  {
    attemptId: {
      type: Schema.Types.ObjectId,
      ref: 'AssessmentAttempt',
      required: true,
      index: true,
    },
    questionId: {
      type: Schema.Types.ObjectId,
      ref: 'AssessmentQuestion',
      required: true,
      index: true,
    },
    selectedOptionId: { type: String, required: true },
    isCorrect: { type: Boolean, default: null },
    marksAwarded: { type: Number, default: 0 },
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

assessmentAnswerSchema.index({ attemptId: 1, questionId: 1 }, { unique: true });

export const AssessmentAnswer: Model<IAssessmentAnswer> =
  mongoose.model<IAssessmentAnswer>('AssessmentAnswer', assessmentAnswerSchema);
