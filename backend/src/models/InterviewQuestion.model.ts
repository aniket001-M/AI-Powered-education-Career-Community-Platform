import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IInterviewQuestion extends Document {
  _id: mongoose.Types.ObjectId;
  sessionId: mongoose.Types.ObjectId;
  questionOrder: number;
  questionText: string;
  category: string;
  expectedKeyPoints: string[];
  createdAt: Date;
}

const interviewQuestionSchema = new Schema<IInterviewQuestion>(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'InterviewSession',
      required: true,
      index: true,
    },
    questionOrder: { type: Number, required: true },
    questionText: { type: String, required: true },
    category: { type: String, default: 'TECHNICAL' },
    expectedKeyPoints: [{ type: String }],
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
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

interviewQuestionSchema.index({ sessionId: 1, questionOrder: 1 });

export const InterviewQuestion: Model<IInterviewQuestion> =
  mongoose.model<IInterviewQuestion>('InterviewQuestion', interviewQuestionSchema);
