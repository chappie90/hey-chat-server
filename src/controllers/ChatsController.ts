import { Request, Response, NextFunction } from 'express';
const mongoose = require('mongoose');

const User = mongoose.model('User');
const Chat = mongoose.model('Chat');
const Message = mongoose.model('Message');
import uploadFileS3 from '../helpers/uploadFileS3';
import deleteFileS3 from '../helpers/deleteFileS3';
import { transformImageName } from '../middleware/processUploads';

const CHAT_MESSAGE_IMG_FOLDER = 'public/uploads/chat';

const getChats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { userId } = req.query;

  let chats,
      unreadMessagesCount: number;

  try {
    const user = await User.findOne(
      { _id: userId }
    ).lean()
     .populate('chats')
     .populate({
       path: 'chats',
       populate: {
         path: 'participants',
         model: 'User',
         select: '_id username avatar'
       }
     });

    chats = user.chats;

    for (const chat of chats) {
       // Get last message to be displayed on each chat
      const lastMessage = await Message.find({ chatId: chat.chatId })
        .sort({ 'message.createDate': -1 })
        .limit(1);
      chat.lastMessage = lastMessage[0];

      // Get number of unread messages
      unreadMessagesCount = await Message.find({
        chatId: chat.chatId,
        sender: { $ne: user.username },
        read: false
      }).count();
      chat.unreadMessagesCount = unreadMessagesCount;

      // Get muted chats
      chat.muted = user.mutedChats.includes(chat.chatId) ? true : false;
    } 

    res.status(200).send({ chats });
  } catch (err) {
    next(err);
  }
};

const getMessages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { chatId } = req.query;

  try {
    const messages = await Message.find({ chatId })
                                  .sort({ 'message.createDate': -1 })
                                  .limit(20);
    
    const allMessagesLoaded = messages.length < 20 ? true : false;

    res.status(200).send({ messages, allMessagesLoaded });
  } catch (err) {
    next(err);
  }
};

const getMoreMessages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { chatId, page } = req.query;

  const offset = 20 * (+page - 1);

  try {
    const messages = await Message.find({ chatId })
                                  .skip(offset)
                                  .sort({ 'message.createDate': -1 })
                                  .limit(20);
    
    const allMessagesLoaded = messages.length < 20 ? true : false;

    res.status(200).send({ messages, allMessagesLoaded });
  } catch (err) {
    next(err);
  }
};

const muteChat = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { userId, chatId, newValue } = req.body;

  try {
    const updateCondition = newValue ?
      { $addToSet: { mutedChats: chatId } } :
      { $pull: { mutedChats: chatId } };

    await User.updateOne({ _id: userId }, updateCondition);

    res.status(200).send({ success: true });
  } catch (err) {
    next(err);
  }
};

const deleteChat = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { userId, _id } = req.body;
  
  try {
    await User.updateOne(
      { _id: userId }, 
      { 
        $pull: { chats: _id },
        $addToSet: { deletedChats: _id }
      }
    );

    res.status(200).send({ success: true });
  } catch (err) {
    next(err);
  }
};

const uploadMessageImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { 
    const imageFile = req.file;
    const buffer = req.file.buffer;
    const mimeType = req.file.mimetype;
    const imageName = transformImageName(imageFile);

    // Upload TO AWS S3 bucket
    // Returns bucket image path
    await uploadFileS3(buffer, imageName, mimeType, `${CHAT_MESSAGE_IMG_FOLDER}/${imageFile.originalname}`, next);

    res.status(200).send({ imageName }); 
  } catch (err) {
    console.log(err);
    next(err);
  }
};

export default {
  getChats,
  getMessages,
  getMoreMessages,
  muteChat,
  deleteChat,
  uploadMessageImage
};