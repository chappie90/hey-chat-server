import { Socket } from "socket.io";
const mongoose = require('mongoose');

const User = mongoose.model('User');
import { TUser, TContact } from '../types/index';
import sendSilentPushNotification from '../helpers/pushNotifications/sendSilentPushNotification';

// Get user contacts
export const getContacts = async (
  io: Socket,
  socket: Socket, 
  users: { [key: string]: Socket },
  user: TUser
): Promise<{ contacts: TContact[], onlineContacts: TContact[] }> => {

  let onlineContacts: TContact[] = [];

  try {
    const chats = [ ...user.chats, ...user.deletedChats ];
    // Pending contacts will always show as offline
    const pendingContacts: TContact[] = user.pendingContacts.map((pC: TContact) => ({ ...pC, pending: true, online: false }));
    const contacts: TContact[] = [ ...pendingContacts, ...user.contacts ];

    for (const contact of contacts) {
      // Get id of chat between user and each contact
      const chatId: string = chats.filter(chat => chat.participants.filter((p: any) => p === contact._id))[0].chatId;
      contact.chatId = chatId;

      // Identify contacts who are online
      const contactId = contact._id.toString();
      if (!contact.pending && contactId in users) {
        contact.online =  true;

        onlineContacts.push(contact);

        // Add online contact to user channel
        users[contactId].join(user._id.toString());
        // Add user to contact's channel
        socket.join(contactId);
      } else {
        contact.online = false;
      }
    }

    return { contacts, onlineContacts };
  } catch (err) {
    console.log('Get contacts socket contacts handler error');
    console.log(err);
  }
};

// User updates profile image
export const onUpdateProfileImage = async (
  socket: Socket, 
  data: string
): Promise<void> => {
  const { userId } = JSON.parse(data);

  const user = await User.findOne({ _id: userId });
  const newProfileImage = user.avatar.small;

  // Notify all active contacts of new profile image
  const imageData = { userId, profileImage: newProfileImage };
  socket.broadcast.to(userId).emit('profile_image_updated', JSON.stringify(imageData));
};

// User deletes contact
export const onDeleteContact = async (
  io: Socket,
  socket: Socket, 
  users: { [key: string]: Socket },
  data: string
): Promise<void> => {
  const { userId, contactId, chatId } = JSON.parse(data);

  // Remove contact from user's pending contacts / contacts list
  // Remove chat from users' chats list and add to deleted chats list
  await User.updateOne(
    { _id: userId }, 
    { 
      $pull: {
        pendingContacts:  contactId,
        contacts: contactId,
        chats: chatId
      },
      $addToSet: { deletedChats: chatId }
    }
  );
  // Remove user from contact's contacts list
  // Remove chat from contact's chats list and add to deleted chats list
  const contact = await User.updateOne(
    { _id: contactId },
    { 
      $pull: { 
        contacts: userId,
        chats: chatId
      },
      $addToSet: { deletedChats: chatId }
    }
  );

  // Check if contact is online
  if (users[contactId]) {
    io.to(users[contactId].id).emit('user_deleted', JSON.stringify(data));
  }else {
    // If contact is offline, send silent push notification with data to update app state
    sendSilentPushNotification(contact.deviceOS, contact.deviceToken, data, 'user_deleted');
  }

  // Send confirmation contact has been deleted
  socket.emit('contact_deleted', JSON.stringify(data))
};
