import mongoose from 'mongoose';

// Each message carries its own timestamp (createdAt) and the tone it was produced under.
const messageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    tone: { type: String, enum: ['professional', 'casual', 'concise'] },
    stopped: { type: Boolean, default: false }, // assistant reply cut short by the user
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const conversationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 80 },
    messages: [messageSchema],
  },
  { timestamps: true }
);

conversationSchema.index({ updatedAt: -1 });

export const Conversation = mongoose.model('Conversation', conversationSchema);
