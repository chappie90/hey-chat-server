import { Request, Response, NextFunction } from 'express';
const mongoose = require('mongoose');

const User = mongoose.model('User');
import sendVoipPushNotification from '../helpers/pushNotifications/sendVoipPushNotification';

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
    const { callId, chatId, caller, callee, callType  } = req.body;

    const user = await User.findOne({ _id: callee._id }).lean();

    const { deviceOS: calleeDeviceOS } = user;

    const deviceToken = calleeDeviceOS === 'ios' ? user.voipDeviceToken : user.deviceToken;

    const data = { callId, chatId, caller, callee, callType };
    // apns-expiration: use 0 or low value? no reatttempts if 0 and fails
    // apns-priority: highest 0
    // apns-topic: the apns-topic header field must use your app’s bundle ID with .voip appended to the end
    // If you’re using certificate-based authentication, you must also register the certificate for VoIP services.
    // The topic is then part of the 1.2.840.113635.100.6.3.4 or 1.2.840.113635.100.6.3.6 extension.

    console.log('hitting controlelr')

    await sendVoipPushNotification(calleeDeviceOS, deviceToken, data, 'voip_notification_received');

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

