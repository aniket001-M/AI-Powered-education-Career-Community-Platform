import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISkill extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  category: string;
  description?: string;
  parentId?: mongoose.Types.ObjectId;
  level: 'FOUNDATIONAL' | 'INTERMEDIATE' | 'ADVANCED';
  tags: string[];
  isActive: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const skillSchema = new Schema<ISkill>(
  {
    name: { type: String, required: true, trim: true, index: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    category: { type: String, required: true, trim: true, index: true },
    description: { type: String, default: null },
    parentId: { type: Schema.Types.ObjectId, ref: 'Skill', default: null, index: true },
    level: {
      type: String,
      enum: ['FOUNDATIONAL', 'INTERMEDIATE', 'ADVANCED'],
      default: 'FOUNDATIONAL',
    },
    tags: [{ type: String }],
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

skillSchema.pre(/^find/, function (this: any, next) {
  if (this.getQuery().deletedAt === undefined) {
    this.where({ deletedAt: null });
  }
  next();
});

export const Skill: Model<ISkill> = mongoose.model<ISkill>('Skill', skillSchema);
