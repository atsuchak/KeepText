import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password?: string;
  name?: string;
  mobileNumber?: string;
  tokenVersion: number;
  noteContent: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      trim: true,
    },
    mobileNumber: {
      type: String,
      trim: true,
    },
    tokenVersion: {
      type: Number,
      default: 0,
    },
    noteContent: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Prevent re-compilation of model
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
