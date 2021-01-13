import { Socket } from 'socket.io';
const mongoose = require('mongoose');

const User = mongoose.model('User');

// User received voip push to wake up device
export const onReceiveVoipPush = async (
  io: Socket,
  socket: Socket, 
  users: { [key: string]: Socket },
  data: string
): Promise<void> => {
  const { callerId, calleeId } = JSON.parse(data);

  // Check if caller is online and get socket id
  if (users[callerId]) {
    const callerSocketId = users[callerId].id;
    // Notify caller voip push has been received
    const responseData = { calleeId };
    io.to(callerSocketId).emit('voip_push_received', JSON.stringify(responseData));
  }
};

// User tries to initiate call
export const onMakeCallOffer = async (
  io: Socket,
  socket: Socket, 
  users: { [key: string]: Socket },
  data: string
): Promise<void> => {
  const { calleeId, offer } = JSON.parse(data);

  // Check if recipient is online and get socket id
  if (users[calleeId]) {
    const calleeSocketId = users[calleeId].id;
    // Send offer to recipient
    const offerData = { offer };
    io.to(calleeSocketId).emit('call_offer_received', JSON.stringify(offerData));
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


// Recipient accepts incoming call
export const onAcceptCall = async (
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
    io.to(callerSocketId).emit('call_accepted', JSON.stringify(answerData));
  }
};

// Recipient rejects incoming call
export const onRejectCall = async (
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
    io.to(callerSocketId).emit('call_rejected');
  }
};

// Caller cancels outgoing call
export const onCancelCall = async (
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
    io.to(recipientSocketId).emit('call_cancelled');
  }
};

// Either user ends call
export const onEndCall = async (
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
    io.to(recipientSocketId).emit('call_ended', JSON.stringify(eventData));
  }
};


