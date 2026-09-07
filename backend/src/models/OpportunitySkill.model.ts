import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOpportunitySkill extends Document {
  _id: mongoose.Types.ObjectId;
  opportunityId: mongoose.Types.ObjectId;
  skillId: mongoose.Types.ObjectId;
  importance: 'REQUIRED' | 'PREFERRED';
  createdAt: Date;
}

const opportunitySkillSchema = new Schema<IOpportunitySkill>(
  {
    opportunityId: {
      type: Schema.Types.ObjectId,
      ref: 'Opportunity',
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
      enum: ['REQUIRED', 'PREFERRED'],
      default: 'REQUIRED',
    },
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

opportunitySkillSchema.index({ opportunityId: 1, skillId: 1 }, { unique: true });

export const OpportunitySkill: Model<IOpportunitySkill> =
  mongoose.model<IOpportunitySkill>('OpportunitySkill', opportunitySkillSchema);
