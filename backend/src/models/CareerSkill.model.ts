import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICareerSkill extends Document {
  _id: mongoose.Types.ObjectId;
  careerId: mongoose.Types.ObjectId;
  skillId: mongoose.Types.ObjectId;
  importance: 'CRITICAL' | 'IMPORTANT' | 'NICE_TO_HAVE';
  weight: number;
  requiredProficiency: number;
  createdAt: Date;
  updatedAt: Date;
}

const careerSkillSchema = new Schema<ICareerSkill>(
  {
    careerId: {
      type: Schema.Types.ObjectId,
      ref: 'Career',
      required: true,
      index: true,
    },
    skillId: {
      type: Schema.Types.ObjectId,
      ref: 'Skill',
      required: true,
      index: true,
    },
    importance: {
      type: String,
      enum: ['CRITICAL', 'IMPORTANT', 'NICE_TO_HAVE'],
      default: 'IMPORTANT',
    },
    weight: { type: Number, default: 3, min: 1, max: 5 },
    requiredProficiency: { type: Number, default: 3, min: 1, max: 5 },
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

careerSkillSchema.index({ careerId: 1, skillId: 1 }, { unique: true });

export const CareerSkill: Model<ICareerSkill> = mongoose.model<ICareerSkill>(
  'CareerSkill',
  careerSkillSchema,
);
