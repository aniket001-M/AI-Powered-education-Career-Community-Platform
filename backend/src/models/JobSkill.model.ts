import mongoose, { Schema, Document, Model } from 'mongoose';

export type JobSkillImportance = 'REQUIRED' | 'PREFERRED';
export type JobSkillStatus = 'STRONG' | 'NEEDS_IMPROVEMENT' | 'MISSING';

export interface IJobSkill extends Document {
  _id: mongoose.Types.ObjectId;
  jobAnalysisId: mongoose.Types.ObjectId;
  skillId?: mongoose.Types.ObjectId;
  skillName: string;
  importance: JobSkillImportance;
  studentProficiency: number;
  status: JobSkillStatus;
  createdAt: Date;
  updatedAt: Date;
}

const jobSkillSchema = new Schema<IJobSkill>(
  {
    jobAnalysisId: {
      type: Schema.Types.ObjectId,
      ref: 'JobAnalysis',
      required: true,
      index: true,
    },
    skillId: {
      type: Schema.Types.ObjectId,
      ref: 'Skill',
      default: null,
      index: true,
    },
    skillName: { type: String, required: true, trim: true },
    importance: {
      type: String,
      enum: ['REQUIRED', 'PREFERRED'],
      default: 'REQUIRED',
    },
    studentProficiency: { type: Number, default: 0, min: 0, max: 5 },
    status: {
      type: String,
      enum: ['STRONG', 'NEEDS_IMPROVEMENT', 'MISSING'],
      default: 'MISSING',
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

jobSkillSchema.index({ jobAnalysisId: 1, skillName: 1 });

export const JobSkill: Model<IJobSkill> = mongoose.model<IJobSkill>(
  'JobSkill',
  jobSkillSchema,
);
