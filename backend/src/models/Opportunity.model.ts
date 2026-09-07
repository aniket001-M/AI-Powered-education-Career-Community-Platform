import mongoose, { Schema, Document, Model } from 'mongoose';

export type OpportunityType =
  | 'INTERNSHIP'
  | 'JOB'
  | 'SCHOLARSHIP'
  | 'HACKATHON'
  | 'COMPETITION'
  | 'CAMPUS_OPPORTUNITY';

export type OpportunityVerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface IOpportunity extends Document {
  _id: mongoose.Types.ObjectId;
  postedBy: mongoose.Types.ObjectId;
  title: string;
  company: string;
  type: OpportunityType;
  description: string;
  location: string;
  applyUrl: string;
  deadline?: Date;
  eligibility?: string;
  stipendOrSalary?: string;
  verificationStatus: OpportunityVerificationStatus;
  verifiedBy?: mongoose.Types.ObjectId;
  verifiedAt?: Date;
  riskScore: number;
  riskSignalsCount: number;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const opportunitySchema = new Schema<IOpportunity>(
  {
    postedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true, index: true },
    type: {
      type: String,
      enum: [
        'INTERNSHIP',
        'JOB',
        'SCHOLARSHIP',
        'HACKATHON',
        'COMPETITION',
        'CAMPUS_OPPORTUNITY',
      ],
      required: true,
      index: true,
    },
    description: { type: String, required: true },
    location: { type: String, required: true, trim: true, index: true },
    applyUrl: { type: String, required: true, trim: true },
    deadline: { type: Date, default: null, index: true },
    eligibility: { type: String, default: null },
    stipendOrSalary: { type: String, default: null },
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
    riskScore: { type: Number, default: 0 },
    riskSignalsCount: { type: Number, default: 0 },
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

opportunitySchema.index({ type: 1, verificationStatus: 1, createdAt: -1 });

opportunitySchema.pre(/^find/, function (this: any, next) {
  if (this.getQuery().isDeleted === undefined) {
    this.where({ isDeleted: false });
  }
  next();
});

export const Opportunity: Model<IOpportunity> = mongoose.model<IOpportunity>(
  'Opportunity',
  opportunitySchema,
);
