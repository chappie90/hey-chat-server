import { Router } from 'express';

import CallCtrl from '../controllers/CallController';

const router = Router();

router.post('/api/call/start', CallCtrl.sendVoipPush);
router.post('/api/call/end', CallCtrl.endCall);

export default router;