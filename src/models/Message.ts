import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  chatId: { type: String, required: true },
  sender: { type: String, required: true },
  message: {
    id: { type: String, required: true }, 
    text: String,
    createDate: { type: Date, required: true }
  },
  delivered: { 
    type: Boolean, 
    required: true,
    default: true 
  },
  read: { 
    type: Boolean,
    required: true, 
    default: false 
  },
  deleted: { 
    type: Boolean, 
    required: true,
    default: false 
  },
  liked: {
    likedByUser: {
      type: Boolean,
      default: false
    },
    likesCount: {
      type: Number,
      default: 0
    }
  },
  reply: { 
    origMsgId: String,
    origMsgText: String,
    origMsgSender: String
  },
  image: { 
    type: String, 
    default: '' 
  },
  admin: {
    type: Boolean,
    default: false
  }
});

mongoose.model('Message', messageSchema);