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

// User accepts incoming video call
export const onAcceptVideoCall = async (
  io: Socket,
  socket: Socket, 
  users: { [key: string]: Socket },
  data: string
): Promise<void> => {
  const { callerId, recipientId, answer } = JSON.parse(data);

  // Check if caller is online and get socket id
  if (users[callerId]) {
    const callerSocketId = users[callerId].id;
    // Send answer to caller
    const answerData = { recipientId, answer };
    io.to(callerSocketId).emit('video_call_accepted', JSON.stringify(answerData));
  }
};

// User rejects incoming video call
export const onRejectVideoCall = async (
  io: Socket,
  socket: Socket, 
  users: { [key: string]: Socket },
  data: string
): Promise<void> => {
  const { callerId } = JSON.parse(data);

  // Check if caller is online and get socket id
  if (users[callerId]) {
    const callerSocketId = users[callerId].id;
    // Send rejection to caller
    io.to(callerSocketId).emit('video_call_rejected');
  }
};