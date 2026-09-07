import mongoose, { Schema, Document, Model } from 'mongoose';

export type ExperienceVerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface ISeniorExperience extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  company: string;
  role: string;
  batch: string;
  department: string;
  title: string;
  content: string;
  interviewProcess?: string;
  preparationTips?: string;
  referralContact?: string;
  verificationStatus: ExperienceVerificationStatus;
  verifiedBy?: mongoose.Types.ObjectId;
  verifiedAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const seniorExperienceSchema = new Schema<ISeniorExperience>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    company: { type: String, required: true, trim: true, index: true },
    role: { type: String, required: true, trim: true, index: true },
    batch: { type: String, required: true, trim: true, index: true },
    department: { type: String, required: true, trim: true, index: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    interviewProcess: { type: String, default: null },
    preparationTips: { type: String, default: null },
    referralContact: { type: String, default: null },
    verificationStatus: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'REJECTED'],
      default: 'PENDING',
      index: true,
    },
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    verifiedAt: { type: Date, default: null },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
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

seniorExperienceSchema.index({ company: 1, role: 1 });
seniorExperienceSchema.index({ verificationStatus: 1, createdAt: -1 });

seniorExperienceSchema.pre(/^find/, function (this: any, next) {
  if (this.getQuery().isDeleted === undefined) {
    this.where({ isDeleted: false });
  }
  next();
});

export const SeniorExperience: Model<ISeniorExperience> =
  mongoose.model<ISeniorExperience>('SeniorExperience', seniorExperienceSchema);
