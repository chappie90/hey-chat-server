import { Router } from 'express';
import multer from 'multer';

import AuthCtrl from '../controllers/AuthController';
import { memoryStorage } from '../middleware/processUploads';

const router = Router();

router.post('/api/signup', AuthCtrl.signup);
router.post('/api/signin', AuthCtrl.signin);
router.get('/api/image', AuthCtrl.getAvatarImage);
router.post(
  '/api/image/upload', 
  multer({ storage: memoryStorage() }).single('profileImage'),
  AuthCtrl.uploadAvatarImage
);
router.patch('/api/image/delete', AuthCtrl.deleteAvatarImage);

export default router;