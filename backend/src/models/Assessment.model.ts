import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAssessment extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  slug: string;
  description: string;
  category: string;
  careerId?: mongoose.Types.ObjectId;
  skillId?: mongoose.Types.ObjectId;
  durationMinutes: number;
  totalMarks: number;
  passingScore: number;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  isActive: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const assessmentSchema = new Schema<IAssessment>(
  {
    title: { type: String, required: true, trim: true, index: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    description: { type: String, required: true },
    category: { type: String, required: true, trim: true, index: true },
    careerId: { type: Schema.Types.ObjectId, ref: 'Career', default: null, index: true },
    skillId: { type: Schema.Types.ObjectId, ref: 'Skill', default: null, index: true },
    durationMinutes: { type: Number, default: 30, min: 5, max: 180 },
    totalMarks: { type: Number, default: 100 },
    passingScore: { type: Number, default: 60 },
    difficulty: {
      type: String,
      enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
      default: 'INTERMEDIATE',
    },
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

assessmentSchema.pre(/^find/, function (this: any, next) {
  if (this.getQuery().deletedAt === undefined) {
    this.where({ deletedAt: null });
  }
  next();
});

export const Assessment: Model<IAssessment> = mongoose.model<IAssessment>(
  'Assessment',
  assessmentSchema,
);
