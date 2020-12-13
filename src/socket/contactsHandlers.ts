import { Socket } from "socket.io";
const mongoose = require('mongoose');

const User = mongoose.model('User');
import { TUser, TContact } from '../types/index';

// Get user contacts
export const getContacts = async (
  io: Socket,
  socket: Socket, 
  users: { [key: string]: Socket },
  user: TUser
): Promise<{ contacts: TContact[], onlineContacts: TContact[] }> => {

  let onlineContacts: TContact[] = [];

  try {
    const chats = [ ...user.chats, ...user.archivedChats ];
    const pendingContacts: TContact[] = user.pendingContacts.map((pC: TContact) => ({ ...pC, pending: true }));
    const contacts: TContact[] = [ ...pendingContacts, ...user.contacts ];

    for (const contact of contacts) {
      // Get id of chat between user and each contact
      const chatId: string = chats.filter(chat => chat.participants.filter((p: any) => p === contact._id))[0].chatId;
      contact.chatId = chatId;

      // Identify contacts who are online
      const contactId = contact._id.toString();
      if (contactId in users) {
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