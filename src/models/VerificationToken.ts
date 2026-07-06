import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IVerificationToken extends Document {
  email: string;
  code: string;
  type: 'signup' | 'reset';
  createdAt: Date;
}

const VerificationTokenSchema: Schema = new Schema({
  email: {
    type: String,
    required: true,
  },
  code: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['signup', 'reset'],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300, // Document automatically removed after 5 minutes (300 seconds)
  },
});

const VerificationToken: Model<IVerificationToken> =
  mongoose.models.VerificationToken ||
  mongoose.model<IVerificationToken>('VerificationToken', VerificationTokenSchema);

export default VerificationToken;
