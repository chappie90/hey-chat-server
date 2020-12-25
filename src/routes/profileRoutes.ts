import { Router } from 'express';
import multer from 'multer';

import ProfileCtrl from '../controllers/ProfileController';
import { memoryStorage } from '../middleware/processUploads';

const router = Router();

router.get('/api/image', ProfileCtrl.getImage);
router.post(
  '/api/image/upload', 
  multer({ storage: memoryStorage() }).single('profileImage'),
  ProfileCtrl.uploadImage
);
router.patch('/api/image/delete', ProfileCtrl.deleteImage);

export default router;