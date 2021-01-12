import { Request, Response, NextFunction } from 'express';
const mongoose = require('mongoose');

const User = mongoose.model('User');
import sendVoipPushNotification from '../helpers/pushNotifications/sendVoipPushNotification';
import sendSilentPushNotification from '../helpers/pushNotifications/sendSilentPushNotification';

const saveDeviceToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId, deviceToken, deviceOS } = req.body;

    await User.updateOne(
      { _id: userId },
      { deviceToken, deviceOS }
    );

    res.status(200).send({ success: true });
  } catch(err) {
    console.log(err);
    next(err);
  }
};

const saveVoipDeviceToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId, voipDeviceToken } = req.body;

    await User.updateOne({ _id: userId }, { voipDeviceToken });

    res.status(200).send({ success: true });
  } catch(err) {
    console.log(err);
    next(err);
  }
}; 

const sendVoipPush = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { callId, chatId, caller, callee, offer, callType  } = req.body;

    const user = await User.findOne({ _id: callee._id }).lean();
    const { deviceOS: calleeDeviceOS } = user;
    const deviceToken = calleeDeviceOS === 'ios' ? user.voipDeviceToken : user.deviceToken;

    const data = { callId, chatId, caller, callee, offer, callType };
  
    console.log(calleeDeviceOS)
    console.log(deviceToken)

    if (calleeDeviceOS === 'ios') {
      await sendVoipPushNotification(deviceToken, data);
    } else {
      await sendSilentPushNotification(calleeDeviceOS, deviceToken, data, 'voip_notification_received');
    }

    res.status(200).send({ success: true });
  } catch(err) {
    console.log(err);
    next(err);
  }
};

export default {
  saveDeviceToken,
  saveVoipDeviceToken,
  sendVoipPush
};

