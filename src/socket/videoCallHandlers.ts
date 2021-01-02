import { Socket } from 'socket.io';
const mongoose = require('mongoose');

const User = mongoose.model('User');

// User tries to initiate video call
export const onMakeVideoCallOffer = async (
  io: Socket,
  socket: Socket, 
  users: { [key: string]: Socket },
  data: string
): Promise<void> => {
  const { 
    callId, 
    chatId, 
    caller: { id: userId, username, profileImage }, 
    recipientId, 
    offer,
    type
  } = JSON.parse(data);

  // Check if recipient is online and get socket id
  if (users[recipientId]) {
    const recipientSocketId = users[recipientId].id;
    // Send offer to recipient
    const offerData = { callId, chatId, caller: { id: userId, username, profileImage }, offer, type };
    io.to(recipientSocketId).emit('video_call_offer_received', JSON.stringify(offerData));
  }
};

// User sends ice candidate
export const onSendICECandidate = async (
  io: Socket,
  socket: Socket, 
  users: { [key: string]: Socket },
  data: string
): Promise<void> => {
  const { userId, contactId, candidate } = JSON.parse(data);

  // Check if contact is online and get socket id
  if (users[contactId]) {
    const contactSocketId = users[contactId].id;
    // Send rejection to caller
    const candidateData = { userId, contactId, candidate };
    io.to(contactSocketId).emit('ice_candidate_received', JSON.stringify(candidateData));
  }
};


// Recipient accepts incoming video call
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

// Recipient rejects incoming video call
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

// Caller cancels outgoing video call
export const onCancelVideoCall = async (
  io: Socket,
  socket: Socket, 
  users: { [key: string]: Socket },
  data: string
): Promise<void> => {
  const { recipientId } = JSON.parse(data);

  // Check if recipient is online and get socket id
  if (users[recipientId]) {
    const recipientSocketId = users[recipientId].id;
    // Send cancellation to caller
    io.to(recipientSocketId).emit('video_call_cancelled');
  }
};

// Either user ends video call
export const onEndVideoCall = async (
  io: Socket,
  socket: Socket, 
  users: { [key: string]: Socket },
  data: string
): Promise<void> => {
  const { chatType, chatId, senderId, senderName, senderProfile, recipientId  } = JSON.parse(data);

  // Check if recipient is online and get socket id
  if (users[recipientId]) {
    const recipientSocketId = users[recipientId].id;
    // Notify user call has been ended
    const eventData = { chatType, chatId, senderId, senderName, senderProfile };
    io.to(recipientSocketId).emit('video_call_ended', JSON.stringify(eventData));
  }
};


