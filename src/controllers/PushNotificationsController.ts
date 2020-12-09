import { Request, Response, NextFunction } from 'express';
const mongoose = require('mongoose');

const User = mongoose.model('User');

const saveDeviceToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId, deviceToken, deviceOS } = req.body;

    console.log('save device token')
    console.log(userId)
    console.log(deviceToken)
    console.log(deviceOS)

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

export default {
  saveDeviceToken
};