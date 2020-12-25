import { Router } from 'express';
import multer from 'multer';

import { memoryStorage } from '../middleware/processUploads';
import ChatsCtrl from '../controllers/ChatsController';

const router = Router();

router.get('/api/chats', ChatsCtrl.getChats);
router.get('/api/messages', ChatsCtrl.getMessages);
router.get('/api/messages/more', ChatsCtrl.getMoreMessages);
router.patch('/api/chat/mute', ChatsCtrl.muteChat);
router.patch('/api/chat/delete', ChatsCtrl.deleteChat);
router.post(
  '/api/messages/image/upload', 
  multer({ storage: memoryStorage() }).single('messageImage')
);

export default router;