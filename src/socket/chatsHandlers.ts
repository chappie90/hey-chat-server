import { Socket } from 'socket.io';
const mongoose = require('mongoose');

const User = mongoose.model('User');
const Chat = mongoose.model('Chat');
const Message = mongoose.model('Message');
import { TChat } from '../types/index';
import sendPushNotification from '../helpers/pushNotifications/sendPushNotification';
import sendSilentPushNotification from '../helpers/pushNotifications/sendSilentPushNotification';

const CHAT_MESSAGE_IMG_FOLDER = 'public/uploads/chat';

// User sends new message
export const onMessage = async (
  io: Socket,
  socket: Socket, 
  users: { [key: string]: Socket },
  data: string
): Promise<void> => {
  const {
    chatType,
    chatId,
    senderId,
    recipientId,
    senderName,
    message,
    isFirstMessage
  } = JSON.parse(data);

  let chat: TChat,
      newChat,
      recipient,
      recipientSocketId: string,
      notification;

  // Update database
  // Private chat
  if (chatType === 'private') {

    recipient = await User.findOne({ _id: recipientId }).lean(); 

    if (isFirstMessage) { 
      // Create chat if first message
      newChat = new Chat({
        chatId,
        type: chatType,
        participants: [senderId, recipientId],
        requester: senderId
      });
      newChat.populate('participants', '_id username profile').execPopulate();
      await newChat.save();

      // Add chat to both users chat lists
      await User.updateOne(
        { _id: recipientId },
        { $addToSet: { chats: newChat._id } }
      );
       
      // Add contact to user's pending contacts and add new chat
      await User.updateOne(
        { _id: senderId }, 
        { 
          $addToSet: {
            pendingContacts:  recipientId,
            chats: newChat._id
          }
        }
      );
    } else {
      // Check if chat request accepted
      chat = await Chat.findOne({ chatId })
        .lean()
        .populate('participants', '_id username profile');

      if (!chat.requestAccepted) {
        // Accept chat request if message sender is recipient of request
        if (chat.requester == recipientId) {
          await Chat.updateOne(
            { chatId }, 
            { $set: { requestAccepted: true } }
          );
          chat.requestAccepted = true;

          // Add both users to each other's contact lists
          await User.updateOne(
            { _id: senderId },
            { $addToSet: { contacts:  recipientId }}
          );

          await User.updateOne(
            { _id: recipientId },
            { 
              $pull: { pendingContacts: senderId },
              $addToSet: { contacts:  senderId }
            }
          );
        }
      }

      // If chat has been delete by recipient, block messages
      if (recipient.deletedChats.includes(chat._id)) return;
    }

  }

  // Create new message
  const newMessage = new Message({
    chatId,
    sender: message.sender.name,
    message: {
      id: message._id,
      text: message.text,
      createDate: message.createDate
    },
    reply: message.reply,
    image: {
      name: message.image,
      path: `${process.env.S3_DATA_URL}/${CHAT_MESSAGE_IMG_FOLDER}/${chatId}/${message.image}`
    }
  });
  await newMessage.save();

  // If new message created successfully
  if (newMessage) {

    // Emit events and send push notifications
    if (chatType === 'private') {
      // Check if message recipient is online and get socket id
      if (users[recipientId]) {
        recipientSocketId = users[recipientId].id;
      }
      
      // Check device OS to use approriate notification provider and get device token
      const { deviceOS, deviceToken } = recipient;

      if (isFirstMessage) {
        // Send pending contact object to sender
        // Set contact as pending
        recipient.pending = true;
        // Set contact chat id
        recipient.chatId = chatId;

        const data = { newChat, newMessage, pendingContact: recipient };

        // Add new chat and send new message to recipient
        // If recipient is online, emit socket event with data
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('first_message_received', JSON.stringify(data));
        } else {
          // If recipient is offline, send silent push notification with data to update app state
          sendSilentPushNotification(deviceOS, deviceToken, data, 'first_message_received');
        }
        // Add new chat, register chat id, add pendinding contact to sender's contacts list
        // and send confirmation of message delivered to sender
        socket.emit('first_message_sent', JSON.stringify(data));
      } else {
        // Get number of unread messages
        const unreadMessagesCount = await Message.find({
          chatId: chat.chatId,
          sender: senderName,
          read: false
        }).count();

        const data = { 
          chat, 
          newMessage, 
          newTMessage: message, 
          senderId,
          unreadMessagesCount
        };

        // If chat has been deleted by sender, restore chat
        const sender = await User.findOne({ _id: senderId });
        if (sender.deletedChats.includes(chat._id)) {
          await User.updateOne(
            { _id: recipientId }, 
            { 
              $pull: { deletedChats: recipientId },
              $addToSet: { chats: recipientId }
            }
          );

          socket.emit('chat_restored', JSON.stringify(data));
        }

        // Send new message to recipient and update chat
        // If recipient is online, emit socket event with data
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('message_received', JSON.stringify(data));
        } else {
          // If recipient is offline, send silent push notification with data to update app state
          sendSilentPushNotification(deviceOS, deviceToken, data, 'message_received');
        }

        // Send confirmation of message delivered to sender and update chat list
        socket.emit('message_sent', JSON.stringify(data));
      }

      // Send push notification
      // For android only if app is in foreground
      if (deviceOS === 'android' && recipientSocketId) {
        sendPushNotification(deviceOS, deviceToken, senderName, message.text);
      }
      if (deviceOS === 'ios')  sendPushNotification(deviceOS, deviceToken, senderName, message.text);
    }
  }
};

// User likes message
export const onLikeMessage = async (
  io: Socket,
  users: { [key: string]: Socket },
  data: string
): Promise<void> => {
  const { chatId, messageId, recipientId } = JSON.parse(data);

  const message = await Message.findOne({ 'message.id': messageId });

  await Message.updateOne(
    { 'message.id': messageId },
    { liked: { 
        likedByUser: !message.liked.likedByUser,
        likesCount: message.liked.likedByUser ? message.liked.likesCount - 1 : message.liked.likesCount + 1
    }}
  );

  const response = { chatId, messageId };

  // Check if message recipient is online and get socket id
  if (users[recipientId]) {
    let recipientSocketId = users[recipientId].id;
    // Notify recipient of like
    io.to(recipientSocketId).emit('message_liked', JSON.stringify(response));
  } else {
    // If recipient is offline, send silent push notification with data to update app state
    // Check device OS to use approriate notification provider and get device token
    const recipient = await User.findOne({ _id: recipientId });
    const { deviceOS, deviceToken } = recipient;

    sendSilentPushNotification(deviceOS, deviceToken, response, 'message_liked');
  }
};

// User deletes message
export const onDeleteMessage = async (
  io: Socket,
  users: { [key: string]: Socket },
  data: string
): Promise<void> => {
  const { chatId, messageId, recipientId } = JSON.parse(data);

  await Message.deleteOne({ 'message.id': messageId });

  const response = { chatId, messageId };

  // Check if message recipient is online and get socket id
  if (users[recipientId]) {
    const recipientSocketId = users[recipientId].id;
    // Notify recipient of delete
    io.to(recipientSocketId).emit('message_deleted', JSON.stringify(response));
  } else {
    // If recipient is offline, send silent push notification with data to update app state
    // Check device OS to use approriate notification provider and get device token
    const recipient = await User.findOne({ _id: recipientId });
    const { deviceOS, deviceToken } = recipient;

    sendSilentPushNotification(deviceOS, deviceToken, response, 'message_deleted');
  }
};

// User reads messages
export const onMarkAllMessagesAsRead = async (
  io: Socket,
  socket: Socket, 
  users: { [key: string]: Socket },
  data: string
): Promise<void> => {
  const { chatId, senderId } = JSON.parse(data);

  // Mark all messages as read
  await Message.updateMany({ chatId }, { read: true });

  const response = { chatId };

  // Check if message sender is online and get socket id
  if (users[senderId]) {
    const senderSocketId = users[senderId].id;
    // Notify sender all messages have been read
    io.to(senderSocketId).emit('messages_marked_as_read_sender', JSON.stringify(response));
  } else {
    // If recipient is offline, send silent push notification with data to update app state
    // Check device OS to use approriate notification provider and get device token
    const sender = await User.findOne({ _id: senderId });
    const { deviceOS, deviceToken } = sender;

    sendSilentPushNotification(deviceOS, deviceToken, response, 'messages_marked_as_read_sender');
  }
};

// User started typing
export const onStartTyping = async (
  io: Socket,
  socket: Socket, 
  users: { [key: string]: Socket },
  data: string
): Promise<void> => {
  const { senderId, recipientId } = JSON.parse(data);

  // Check if contact is online and get socket id
  if (users[recipientId]) {
    const recipientSocketId = users[recipientId].id;
    // Notify contact user is typing
    io.to(recipientSocketId).emit('contact_is_typing', senderId);
  }
};

// User stopped typing
export const onStopTyping = async (
  io: Socket,
  socket: Socket, 
  users: { [key: string]: Socket },
  data: string
): Promise<void> => {
  const { senderId, recipientId } = JSON.parse(data);

  // Check if contact is online and get socket id
  if (users[recipientId]) {
    const recipientSocketId = users[recipientId].id;
    // Notify contact user has stopped typing
    io.to(recipientSocketId).emit('contact_stopped_typing', senderId);
  }
};