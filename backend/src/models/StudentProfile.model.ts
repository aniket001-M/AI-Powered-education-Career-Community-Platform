import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProject {
  _id?: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  technologies: string[];
  githubUrl?: string;
  liveUrl?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface ICertification {
  _id?: mongoose.Types.ObjectId;
  title: string;
  issuer?: string;
  date?: Date;
  url?: string;
}

export interface ICareerGoal {
  _id?: mongoose.Types.ObjectId;
  careerId?: mongoose.Types.ObjectId;
  title: string;
  isPrimary: boolean;
  targetRole?: string;
  timeline?: string;
  preferredLocations?: string[];
  notes?: string;
  createdAt?: Date;
}

export interface IStudentProfile extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  // Academic fields
  college?: string;
  department?: string;
  year?: number;
  semester?: number;
  cgpa?: number;
  expectedGraduationYear?: number;
  academicInterests: string[];
  // Personal / Contact
  bio?: string;
  phone?: string;
  // Career & Portfolio
  careerGoals: ICareerGoal[];
  projects: IProject[];
  certifications: ICertification[];
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProject>(
  {
    title: { type: String, required: true },
    description: { type: String, default: null },
    technologies: [{ type: String }],
    githubUrl: { type: String, default: null },
    liveUrl: { type: String, default: null },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
  },
  {
    _id: true,
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
        ret.id = ret._id ? ret._id.toString() : undefined;
        delete ret._id;
        return ret;
      },
    },
  },
);

const certificationSchema = new Schema<ICertification>(
  {
    title: { type: String, required: true },
    issuer: { type: String, default: null },
    date: { type: Date, default: null },
    url: { type: String, default: null },
  },
  {
    _id: true,
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
        ret.id = ret._id ? ret._id.toString() : undefined;
        delete ret._id;
        return ret;
      },
    },
  },
);

const careerGoalSchema = new Schema<ICareerGoal>(
  {
    careerId: { type: Schema.Types.ObjectId, ref: 'Career', default: null },
    title: { type: String, required: true },
    isPrimary: { type: Boolean, default: false },
    targetRole: { type: String, default: null },
    timeline: { type: String, default: null },
    preferredLocations: [{ type: String }],
    notes: { type: String, default: null },
    createdAt: { type: Date, default: Date.now },
  },
  {
    _id: true,
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
        ret.id = ret._id ? ret._id.toString() : undefined;
        delete ret._id;
        return ret;
      },
    },
  },
);

const studentProfileSchema = new Schema<IStudentProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    college: { type: String, default: null },
    department: { type: String, default: null },
    year: { type: Number, default: null, min: 1, max: 6 },
    semester: { type: Number, default: null, min: 1, max: 12 },
    cgpa: { type: Number, default: null, min: 0, max: 10 },
    expectedGraduationYear: { type: Number, default: null },
    bio: { type: String, default: null, maxlength: 500 },
    phone: { type: String, default: null },
    academicInterests: [{ type: String }],
    careerGoals: [careerGoalSchema],
    projects: [projectSchema],
    certifications: [certificationSchema],
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

// Exclude soft-deleted profiles from queries by default
studentProfileSchema.pre(/^find/, function (this: any, next) {
  if (this.getQuery().deletedAt === undefined) {
    this.where({ deletedAt: null });
  }
  next();
});

export const StudentProfile: Model<IStudentProfile> = mongoose.model<IStudentProfile>(
  'StudentProfile',
  studentProfileSchema,
);
