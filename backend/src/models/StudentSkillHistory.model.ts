import mongoose, { Schema, Document, Model } from 'mongoose';
import { SkillSource } from './StudentSkill.model';

export interface IStudentSkillHistory extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  skillId: mongoose.Types.ObjectId;
  previousProficiency: number;
  newProficiency: number;
  source: SkillSource;
  reason?: string;
  recordedAt: Date;
}

const studentSkillHistorySchema = new Schema<IStudentSkillHistory>(
  {
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
    previousProficiency: { type: Number, required: true, min: 0, max: 5 },
    newProficiency: { type: Number, required: true, min: 0, max: 5 },
    source: {
      type: String,
      enum: ['MANUAL', 'ASSESSMENT', 'INTERVIEW', 'ADMIN', 'SYSTEM'],
      default: 'MANUAL',
    },
    reason: { type: String, default: null },
    recordedAt: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: false,
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
        ret.id = ret._id ? ret._id.toString() : undefined;
        delete ret._id;
        return ret;
      },
    },
  },
);

studentSkillHistorySchema.index({ userId: 1, skillId: 1, recordedAt: -1 });

export const StudentSkillHistory: Model<IStudentSkillHistory> = mongoose.model<IStudentSkillHistory>(
  'StudentSkillHistory',
  studentSkillHistorySchema,
);
