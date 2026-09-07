import mongoose, { Schema, Document, Model } from 'mongoose';

export type CommunityPostType =
  | 'QUESTION'
  | 'EXPERIENCE'
  | 'RESOURCE'
  | 'INTERVIEW_EXPERIENCE'
  | 'OPPORTUNITY'
  | 'WARNING'
  | 'DISCUSSION';

export interface ICommunityPost extends Document {
  _id: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  title: string;
  content: string;
  category: string;
  postType: CommunityPostType;
  tags: string[];
  likesCount: number;
  commentsCount: number;
  reportsCount: number;
  isPinned: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const communityPostSchema = new Schema<ICommunityPost>(
  {
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    postType: {
      type: String,
      enum: [
        'QUESTION',
        'EXPERIENCE',
        'RESOURCE',
        'INTERVIEW_EXPERIENCE',
        'OPPORTUNITY',
        'WARNING',
        'DISCUSSION',
      ],
      default: 'DISCUSSION',
      index: true,
    },
    tags: [{ type: String, trim: true, index: true }],
    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    reportsCount: { type: Number, default: 0 },
    isPinned: { type: Boolean, default: false },
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

communityPostSchema.index({ category: 1, createdAt: -1 });
communityPostSchema.index({ tags: 1, createdAt: -1 });

communityPostSchema.pre(/^find/, function (this: any, next) {
  if (this.getQuery().isDeleted === undefined) {
    this.where({ isDeleted: false });
  }
  next();
});

export const CommunityPost: Model<ICommunityPost> =
  mongoose.model<ICommunityPost>('CommunityPost', communityPostSchema);
