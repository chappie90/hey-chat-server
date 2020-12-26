import { Socket } from 'socket.io';
const mongoose = require('mongoose');

const User = mongoose.model('User');

// User tries to initiate video call
export const onMakeOutgoingVideoCall = async (
  io: Socket,
  socket: Socket, 
  users: { [key: string]: Socket },
  data: string
): Promise<void> => {
  const { callerId, callerName, recipientId, offer } = JSON.parse(data);

  // Check if recipient is online and get socket id
  if (users[recipientId]) {
    const recipientSocketId = users[recipientId].id;
    // Send offer to recipient
    const offerData = { callerId, callerName, offer };
    io.to(recipientSocketId).emit('incoming_video_call_received', JSON.stringify(offerData));
  }
};
