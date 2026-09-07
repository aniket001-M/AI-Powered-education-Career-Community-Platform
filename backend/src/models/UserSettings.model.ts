import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUserSettings extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  emailNotifications: boolean;
  pushNotifications: boolean;
  theme: 'light' | 'dark' | 'system';
  profileVisibility: 'PUBLIC' | 'COLLEGE_ONLY' | 'PRIVATE';
  createdAt: Date;
  updatedAt: Date;
}

const userSettingsSchema = new Schema<IUserSettings>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    emailNotifications: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: true },
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system',
    },
    profileVisibility: {
      type: String,
      enum: ['PUBLIC', 'COLLEGE_ONLY', 'PRIVATE'],
      default: 'COLLEGE_ONLY',
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

export const UserSettings: Model<IUserSettings> =
  mongoose.model<IUserSettings>('UserSettings', userSettingsSchema);
