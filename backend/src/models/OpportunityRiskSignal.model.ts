import mongoose, { Schema, Document, Model } from 'mongoose';

export type RiskSignalType =
  | 'UNVERIFIED_EMAIL_DOMAIN'
  | 'UPFRONT_FEE_REQUEST'
  | 'SUSPICIOUS_TELEGRAM_LINK'
  | 'UNREALISTIC_COMPENSATION'
  | 'ANONYMOUS_RECRUITER'
  | 'OTHER';

export type RiskSeverity = 'LOW' | 'MEDIUM' | 'HIGH';
export type RiskSignalStatus = 'FLAGGED' | 'RESOLVED' | 'DISMISSED';

export interface IOpportunityRiskSignal extends Document {
  _id: mongoose.Types.ObjectId;
  opportunityId: mongoose.Types.ObjectId;
  reportedBy: mongoose.Types.ObjectId;
  signalType: RiskSignalType;
  severity: RiskSeverity;
  evidenceDescription: string;
  status: RiskSignalStatus;
  createdAt: Date;
  updatedAt: Date;
}

const opportunityRiskSignalSchema = new Schema<IOpportunityRiskSignal>(
  {
    opportunityId: {
      type: Schema.Types.ObjectId,
      ref: 'Opportunity',
      required: true,
      index: true,
    },
    reportedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    signalType: {
      type: String,
      enum: [
        'UNVERIFIED_EMAIL_DOMAIN',
        'UPFRONT_FEE_REQUEST',
        'SUSPICIOUS_TELEGRAM_LINK',
        'UNREALISTIC_COMPENSATION',
        'ANONYMOUS_RECRUITER',
        'OTHER',
      ],
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      default: 'MEDIUM',
      index: true,
    },
    evidenceDescription: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['FLAGGED', 'RESOLVED', 'DISMISSED'],
      default: 'FLAGGED',
      index: true,
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

opportunityRiskSignalSchema.index({ opportunityId: 1, createdAt: -1 });

export const OpportunityRiskSignal: Model<IOpportunityRiskSignal> =
  mongoose.model<IOpportunityRiskSignal>(
    'OpportunityRiskSignal',
    opportunityRiskSignalSchema,
  );
