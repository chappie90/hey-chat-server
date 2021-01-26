import { Router } from 'express';

import PushNotificationsCtrl from '../controllers/PushNotificationsController';

const router = Router();

router.post('/api/push-notifications/token/save', PushNotificationsCtrl.saveDeviceToken);
router.post('/api/push-notifications/token/voip/save', PushNotificationsCtrl.saveVoipDeviceToken);

export default router;