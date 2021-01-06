import { Router } from 'express';

import PushNotificationsCtrl from '../controllers/PushNotificationsController';

const router = Router();

router.post('/api/push-notifications/token/save', PushNotificationsCtrl.saveDeviceToken);
router.post('/api/push-notifications/voip/token/save', PushNotificationsCtrl.saveVoipDeviceToken);
router.post('/api/push-notifications/voip/send', PushNotificationsCtrl.sendVoipPush);

export default router;