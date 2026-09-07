import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISkillRelation extends Document {
  _id: mongoose.Types.ObjectId;
  parentSkillId: mongoose.Types.ObjectId;
  childSkillId: mongoose.Types.ObjectId;
  relationType: 'PREREQUISITE' | 'SUBCATEGORY' | 'RELATED';
  createdAt: Date;
}

const skillRelationSchema = new Schema<ISkillRelation>(
  {
    parentSkillId: {
      type: Schema.Types.ObjectId,
      ref: 'Skill',
      required: true,
      index: true,
    },
    childSkillId: {
      type: Schema.Types.ObjectId,
      ref: 'Skill',
      required: true,
      index: true,
    },
    relationType: {
      type: String,
      enum: ['PREREQUISITE', 'SUBCATEGORY', 'RELATED'],
      default: 'PREREQUISITE',
    },
    createdAt: { type: Date, default: Date.now },
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

skillRelationSchema.index(
  { parentSkillId: 1, childSkillId: 1, relationType: 1 },
  { unique: true },
);

export const SkillRelation: Model<ISkillRelation> = mongoose.model<ISkillRelation>(
  'SkillRelation',
  skillRelationSchema,
);
