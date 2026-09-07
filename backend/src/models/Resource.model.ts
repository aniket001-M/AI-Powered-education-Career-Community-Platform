import mongoose, { Schema, Document, Model } from 'mongoose';

export type ResourceType =
  | 'PDF'
  | 'VIDEO'
  | 'ARTICLE'
  | 'COURSE'
  | 'PRACTICE'
  | 'PROJECT'
  | 'NOTE'
  | 'SYLLABUS'
  | 'LAB_MANUAL'
  | 'QUESTION_PAPER';

export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface IResource extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  slug: string;
  description: string;
  type: ResourceType;
  url: string;
  storageKey?: string;
  skillId?: mongoose.Types.ObjectId;
  subject?: string;
  college?: string;
  department?: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  uploadedBy: mongoose.Types.ObjectId;
  verificationStatus: VerificationStatus;
  accessCount: number;
  completionCount: number;
  isActive: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const resourceSchema = new Schema<IResource>(
  {
    title: { type: String, required: true, trim: true, index: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: { type: String, required: true },
    type: {
      type: String,
      enum: [
        'PDF',
        'VIDEO',
        'ARTICLE',
        'COURSE',
        'PRACTICE',
        'PROJECT',
        'NOTE',
        'SYLLABUS',
        'LAB_MANUAL',
        'QUESTION_PAPER',
      ],
      required: true,
      index: true,
    },
    url: { type: String, required: true },
    storageKey: { type: String, default: null },
    skillId: {
      type: Schema.Types.ObjectId,
      ref: 'Skill',
      default: null,
      index: true,
    },
    subject: { type: String, default: null, index: true },
    college: { type: String, default: null, index: true },
    department: { type: String, default: null },
    difficulty: {
      type: String,
      enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
      default: 'INTERMEDIATE',
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    verificationStatus: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'REJECTED'],
      default: 'VERIFIED',
      index: true,
    },
    accessCount: { type: Number, default: 0 },
    completionCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
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

resourceSchema.pre(/^find/, function (this: any, next) {
  if (this.getQuery().deletedAt === undefined) {
    this.where({ deletedAt: null });
  }
  next();
});

export const Resource: Model<IResource> = mongoose.model<IResource>(
  'Resource',
  resourceSchema,
);
