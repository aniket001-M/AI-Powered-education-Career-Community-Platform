import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICareer extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  slug: string;
  category: string;
  description: string;
  overview?: string;
  salaryRange?: {
    min: number;
    max: number;
    currency: string;
  };
  demandLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' | 'EMERGING';
  growthRate?: string;
  isActive: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const careerSchema = new Schema<ICareer>(
  {
    title: { type: String, required: true, trim: true, index: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    category: { type: String, required: true, trim: true, index: true },
    description: { type: String, required: true },
    overview: { type: String, default: null },
    salaryRange: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
      currency: { type: String, default: 'INR' },
    },
    demandLevel: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH', 'EMERGING'],
      default: 'HIGH',
    },
    growthRate: { type: String, default: '+15%' },
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

careerSchema.pre(/^find/, function (this: any, next) {
  if (this.getQuery().deletedAt === undefined) {
    this.where({ deletedAt: null });
  }
  next();
});

export const Career: Model<ICareer> = mongoose.model<ICareer>('Career', careerSchema);
