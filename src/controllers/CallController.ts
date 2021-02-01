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
    const { chatId, calleeId, message   } = req.body;

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

    const user = await User.findOne({ _id: calleeId }).lean();
    const { deviceOS, deviceToken } = user;
    
    const data = { chatId, message };

    await sendSilentPushNotification(deviceOS, deviceToken, data, 'voip_call_ended', chatId);
    
    res.status(200).send({ success: true });
  } catch(err) {
    console.log(err);
    next(err);
  }
};

const toggleVideo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { chatId, calleeId, isRemoteEnabled } = req.body;

    const user = await User.findOne({ _id: calleeId }).lean();
    const { deviceOS, deviceToken } = user;
    
    const data = { chatId, isRemoteEnabled };

    await sendSilentPushNotification(deviceOS, deviceToken, data, 'voip_video_toggled', chatId);
    
    res.status(200).send({ success: true });
  } catch(err) {
    console.log(err);
    next(err);
  }
};

export default {
  sendVoipPush,
  endCall,
  toggleVideo
};

