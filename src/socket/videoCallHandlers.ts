import { Socket } from 'socket.io';
const mongoose = require('mongoose');

const User = mongoose.model('User');

// User sends offer to start video call
export const onSendOfferVideoCall = async (
  io: Socket,
  socket: Socket, 
  users: { [key: string]: Socket },
  data: string
): Promise<void> => {
  const { senderId, recipientId, offer } = JSON.parse(data);

  // Check if recipient is online and get socket id
  if (users[recipientId]) {
    const recipientSocketId = users[recipientId].id;
    // Send offer to recipient
    const offerData = { senderId, offer };
    io.to(recipientSocketId).emit('video_call_offer_received', offerData);
  }
};
