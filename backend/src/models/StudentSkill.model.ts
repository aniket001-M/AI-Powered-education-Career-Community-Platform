import mongoose, { Schema, Document, Model } from 'mongoose';

export type SkillSource = 'MANUAL' | 'ASSESSMENT' | 'INTERVIEW' | 'ADMIN' | 'SYSTEM';

export interface IStudentSkill extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  skillId: mongoose.Types.ObjectId;
  proficiency: number;
  confidence: number;
  source: SkillSource;
  lastAssessedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const studentSkillSchema = new Schema<IStudentSkill>(
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
    proficiency: {
      type: Number,
      required: true,
      min: 0,
      max: 5,
      default: 1,
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100,
      default: 50,
    },
    source: {
      type: String,
      enum: ['MANUAL', 'ASSESSMENT', 'INTERVIEW', 'ADMIN', 'SYSTEM'],
      default: 'MANUAL',
    },
    lastAssessedAt: {
      type: Date,
      default: Date.now,
    },
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

studentSkillSchema.index({ userId: 1, skillId: 1 }, { unique: true });

export const StudentSkill: Model<IStudentSkill> = mongoose.model<IStudentSkill>(
  'StudentSkill',
  studentSkillSchema,
);
