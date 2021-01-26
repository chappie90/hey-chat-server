import { Request, Response, NextFunction } from 'express';
const mongoose = require('mongoose');

const User = mongoose.model('User');
const Message = mongoose.model('Message');
import sendVoipPushNotification from '../helpers/pushNotifications/sendVoipPushNotification';
import sendSilentPushNotification from '../helpers/pushNotifications/sendSilentPushNotification';

const sendVoipPush = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { callId, chatId, caller, callee, callType  } = req.body;

    const user = await User.findOne({ _id: callee._id }).lean();
    const { deviceOS: calleeDeviceOS } = user;
    const deviceToken = calleeDeviceOS === 'ios' ? user.voipDeviceToken : user.deviceToken;

    const data = { callId, chatId, caller, callee, callType };

    console.log(data)

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

const endCall = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { calleeId  } = req.body;

    const user = await User.findOne({ _id: calleeId }).lean();
    const { deviceOS, deviceToken } = user;

    await sendSilentPushNotification(deviceOS, deviceToken, null, 'voip_call_ended');
    

    res.status(200).send({ success: true });
  } catch(err) {
    console.log(err);
    next(err);
  }
};

const markMissedCall = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { chatId, message  } = req.body;

  console.log('mark missed call')
  console.log(chatId)
  console.log(message)

  // Create new message for missed call
  try {
    const newMessage = new Message({
      chatId,
      sender: message.sender.name,
      message: {
        id: message._id,
        text: message.text,
        createDate: message.createDate
      },
      admin: true
    });
    await newMessage.save();

    res.status(200).send({ missedCallMessage: newMessage });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

export default {
  sendVoipPush,
  endCall,
  markMissedCall
};

