import { Socket } from "socket.io";
const mongoose = require('mongoose');

const User = mongoose.model('User');
import { getContacts } from './contactsHandlers';

export const onConnect = async (
  io: Socket,
  socket: Socket, 
  users: { [key: string]: Socket }
): Promise<{ userId: string, socketId: string }> => {
  console.log('Socket connected');

  const userId: string = socket.handshake.query.userId;
  const socketId: string = socket.id;

  // Add user to list of users on connect
  users[userId] = socket;

  // Create channel for user
  socket.join(userId);

  try {
    const user = await User.findOne(
      { _id: userId }
    ).lean()
      .populate('pendingContacts', 'username')
      .populate('contacts', 'username')
      .populate('chats', 'chatId participants')
      .populate('archivedChats', 'participants');

    // Get user contacts
    // Add online contacts to user's channel
    // Add user to online contacts channels
    const { contacts, onlineContacts } = await getContacts(io, socket, users, user);

    // Notify all online contacts in your channel you are now online
    socket.broadcast.to(userId).emit('user_online', JSON.stringify({ user }));

    // Send user list of contacts
    socket.emit('get_contacts', JSON.stringify({ contacts }));

    // Send user list of online contacts
    socket.emit('get_online_contacts', JSON.stringify({ onlineContacts }));

    // Notify user connection is successful
    socket.emit('user_connected');

    return { userId, socketId };
  } catch (err) {
    console.log('On connect socket error');
    console.log(err);
  }
};

export const onDisconnect = async (
  io: any,
  socket: Socket, 
  users: { [key: string]: Socket },
  userId: string
) => {
  console.log('Socket disconnected');

  // Notify all online contacts in your channel you are now offline
  socket.broadcast.to(userId).emit('user_offline', userId);

  // Remove all contacts from user channel and delete channel
  io.of('/').in(userId).clients((error, socketIds) => {
    if (error) throw error;

    socketIds.forEach(socketId => {
       // Leave contact room
      const contactId = io.sockets.sockets[socketId].handshake.query.userId;
      socket.leave(contactId);
      // Remove contact from user room
      io.sockets.sockets[socketId].leave(userId);
    });
  });

  // Delete user from list of active users
  delete users[userId];
};