import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICommunityLike extends Document {
  _id: mongoose.Types.ObjectId;
  postId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const communityLikeSchema = new Schema<ICommunityLike>(
  {
    postId: {
      type: Schema.Types.ObjectId,
      ref: 'CommunityPost',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
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

communityLikeSchema.index({ postId: 1, userId: 1 }, { unique: true });

export const CommunityLike: Model<ICommunityLike> =
  mongoose.model<ICommunityLike>('CommunityLike', communityLikeSchema);
