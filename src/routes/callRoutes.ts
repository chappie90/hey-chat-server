import { Router } from 'express';

import CallCtrl from '../controllers/CallController';

const router = Router();

router.post('/api/call/start', CallCtrl.sendVoipPush);
router.post('/api/call/missed', CallCtrl.missedCall);
router.post('/api/call/end', CallCtrl.endCall);
router.post('/api/call/video/camera', CallCtrl.toggleVideo);

export default router;