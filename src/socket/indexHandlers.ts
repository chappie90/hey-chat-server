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

  // Add user to list of users on connect
  users[userId] = socket;

  // Create channel for user
  socket.join(userId);

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
  Object.keys(users).length;
  console.log(userId)
  console.log('before')
  console.log(users)
  // Remove user from all channels
  io.of('/').in(userId).clients((error, socketIds) => {
    if (error) throw error;
    console.log('socket ids')
    console.log(socketIds)
    socketIds.forEach(socketId => io.sockets.sockets[socketId].leave(userId));
  });
  // Delete user from list of active users
  delete users[userId];
  console.log('after');
  Object.keys(users).length;
  console.log(users)
};