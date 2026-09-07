import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISavedOpportunity extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  opportunityId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const savedOpportunitySchema = new Schema<ISavedOpportunity>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    opportunityId: {
      type: Schema.Types.ObjectId,
      ref: 'Opportunity',
      required: true,
      index: true,
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

savedOpportunitySchema.index({ userId: 1, opportunityId: 1 }, { unique: true });

export const SavedOpportunity: Model<ISavedOpportunity> =
  mongoose.model<ISavedOpportunity>('SavedOpportunity', savedOpportunitySchema);
