import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
  chatId: { type: String, required: true },
  type: { type: String, required: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createDate: {
    type: Date,
    required: true,
    default: Date.now()
  },
  requestAccepted: { type: Boolean, default: false },
  requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  creator: String,
  image: {
    name: String
  }
});

mongoose.model('Chat', chatSchema);