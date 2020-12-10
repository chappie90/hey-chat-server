import { Socket } from "socket.io";
const mongoose = require('mongoose');

const User = mongoose.model('User');

export const onConnect = async (
  io: any,
  socket: Socket, 
  users: { [key: string]: Socket }
): Promise<{ userId: string, socketId: string }> => {
  console.log('Socket connected');

  const onlineContacts: string[] = [];

  const userId: string = socket.handshake.query.userId;
  const socketId: string = socket.id;

    // Get list of all rooms
    console.log('list before')
    console.log(io.sockets.adapter.rooms);

  // Add user to list of users on connect
  users[userId] = socket;

  // Create channel for user
  socket.join(userId);

    // Get list of all rooms
    console.log('list before')
    console.log(io.sockets.adapter.rooms);

  try {
    const user = await User.findOne({ _id: userId }).lean();

    const contacts = [ ...user.pendingContacts, ...user.contacts ];

    // Get a list of user contacts who are online
    for (const contactId of contacts) {
      const contactIdStr = contactId.toString();
      if (contactIdStr in users) {
        if (!onlineContacts.includes(contactIdStr)) {
          onlineContacts.push(contactIdStr);
        }
        // Add online contact to user channel
        users[contactIdStr].join(userId);
        // Add user to contact's channel
        socket.join(contactIdStr);
      }
    }

    // Notify all online contacts in your channel you are now online
    socket.broadcast.to(userId).emit('new_online_user', userId);

    // Send yourself a list of your online contacts
    socket.emit('my_online_contacts', onlineContacts);
  } catch (err) {
    console.log(err);
  }

  return { userId, socketId };
};

export const onDisconnect = async (
  io: any,
  socket: Socket, 
  users: { [key: string]: Socket },
  userId: string
) => {
  console.log('Socket disconnected');
  // Get list of all rooms
  console.log('list before')
  console.log(io.sockets.adapter.rooms);
  // Remove all contacts from user channel and delete channel
  // io.of('/').in(userId).clients((error, socketIds) => {
  //   if (error) throw error;
  //   socketIds.forEach(socketId => {
  //     console.log('for each socket')
  //     console.log(socketId;
  //     io.sockets.sockets[socketId].leave(userId);
  //   });
  // });
  // Get list of all rooms
  console.log('list after')
  console.log(io.sockets.adapter.rooms);
  // Delete user from list of active users
  delete users[userId];
};