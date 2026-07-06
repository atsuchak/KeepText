import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INoteHistory extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  content: string;
  isPinned?: boolean;
  order?: number;
  createdAt: Date;
  updatedAt: Date;
}

const NoteHistorySchema: Schema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    order: {
      type: Number,
      default: 0,
    }
  },
  {
    timestamps: true,
  }
);

// Prevent re-compilation of model
const NoteHistory: Model<INoteHistory> = mongoose.models.NoteHistory || mongoose.model<INoteHistory>('NoteHistory', NoteHistorySchema);

export default NoteHistory;
