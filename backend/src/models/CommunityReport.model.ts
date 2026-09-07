import mongoose, { Schema, Document, Model } from 'mongoose';

export type ReportStatus = 'PENDING' | 'REVIEWED' | 'DISMISSED' | 'ACTION_TAKEN';

export interface ICommunityReport extends Document {
  _id: mongoose.Types.ObjectId;
  postId: mongoose.Types.ObjectId;
  reporterId: mongoose.Types.ObjectId;
  reason: string;
  details?: string;
  status: ReportStatus;
  createdAt: Date;
  updatedAt: Date;
}

const communityReportSchema = new Schema<ICommunityReport>(
  {
    postId: {
      type: Schema.Types.ObjectId,
      ref: 'CommunityPost',
      required: true,
      index: true,
    },
    reporterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    reason: { type: String, required: true, trim: true },
    details: { type: String, default: null, trim: true },
    status: {
      type: String,
      enum: ['PENDING', 'REVIEWED', 'DISMISSED', 'ACTION_TAKEN'],
      default: 'PENDING',
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

communityReportSchema.index({ postId: 1, reporterId: 1 });
communityReportSchema.index({ status: 1, createdAt: -1 });

export const CommunityReport: Model<ICommunityReport> =
  mongoose.model<ICommunityReport>('CommunityReport', communityReportSchema);
