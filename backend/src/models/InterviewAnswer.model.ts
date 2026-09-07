import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IInterviewAnswer extends Document {
  _id: mongoose.Types.ObjectId;
  sessionId: mongoose.Types.ObjectId;
  questionId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  answerText: string;
  durationSeconds: number;
  submittedAt: Date;
}

const interviewAnswerSchema = new Schema<IInterviewAnswer>(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'InterviewSession',
      required: true,
      index: true,
    },
    questionId: {
      type: Schema.Types.ObjectId,
      ref: 'InterviewQuestion',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    answerText: { type: String, required: true },
    durationSeconds: { type: Number, default: 0 },
    submittedAt: { type: Date, default: Date.now },
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

interviewAnswerSchema.index({ sessionId: 1, questionId: 1 }, { unique: true });

export const InterviewAnswer: Model<IInterviewAnswer> =
  mongoose.model<IInterviewAnswer>('InterviewAnswer', interviewAnswerSchema);
