import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICareerGoalDoc extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  careerId: mongoose.Types.ObjectId;
  isPrimary: boolean;
  targetRole?: string;
  timeline?: string;
  preferredLocations: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const careerGoalSchema = new Schema<ICareerGoalDoc>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    careerId: {
      type: Schema.Types.ObjectId,
      ref: 'Career',
      required: true,
      index: true,
    },
    isPrimary: { type: Boolean, default: false },
    targetRole: { type: String, default: null },
    timeline: { type: String, default: null },
    preferredLocations: [{ type: String }],
    notes: { type: String, default: null },
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

careerGoalSchema.index({ userId: 1, careerId: 1 }, { unique: true });

export const CareerGoal: Model<ICareerGoalDoc> = mongoose.model<ICareerGoalDoc>(
  'CareerGoal',
  careerGoalSchema,
);
