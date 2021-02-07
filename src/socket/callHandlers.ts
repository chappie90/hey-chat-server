import { Socket } from 'socket.io';
const mongoose = require('mongoose');

const User = mongoose.model('User');

// Callee sends sdp offer on call answer
export const onSendSdpOffer = async (
  io: Socket,
  socket: Socket, 
  users: { [key: string]: Socket },
  data: string
): Promise<void> => {
  const { callerId, offer } = JSON.parse(data);

  console.log('on send sdp offer')
  console.log(callerId)
  console.log(offer)
  console.log(users)
  console.log(users[callerId])

  // Check if recipient is online and get socket id
  if (users[callerId]) {
    const callerSocketId = users[callerId].id;
    // Send offer to recipient
    const offerData = { offer };
    io.to(callerSocketId).emit('sdp_offer_received', JSON.stringify(offerData));
  }
};

// User sends ice candidate
export const onSendICECandidate = async (
  io: Socket,
  socket: Socket, 
  users: { [key: string]: Socket },
  data: string
): Promise<void> => {
  const { contactId, candidate } = JSON.parse(data);

  // Check if contact is online and get socket id
  if (users[contactId]) {
    const contactSocketId = users[contactId].id;
    // Send rejection to caller
    const candidateData = { candidate };
    io.to(contactSocketId).emit('ice_candidate_received', JSON.stringify(candidateData));
  }
};

// Caller sends sdp answer
export const onSendSdpAnswer = async (
  io: Socket,
  socket: Socket, 
  users: { [key: string]: Socket },
  data: string
): Promise<void> => {
  const { calleeId, answer } = JSON.parse(data);

  // Check if caller is online and get socket id
  if (users[calleeId]) {
    const calleeSocketId = users[calleeId].id;
    // Send answer to caller
    const answerData = { answer };
    io.to(calleeSocketId).emit('sdp_answer_received', JSON.stringify(answerData));
  }
};

// Either user ends call
export const onEndCall = async (
  io: Socket,
  socket: Socket, 
  users: { [key: string]: Socket },
  data: string
): Promise<void> => {
  const { contactId  } = JSON.parse(data);

  // Check if contact is online and get socket id
  if (users[contactId]) {
    const contactSocketId = users[contactId].id;
    // Notify user call has been ended
    console.log('emitting call_ended')
    io.to(contactSocketId).emit('call_ended');
  }
};

