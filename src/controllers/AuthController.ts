import { Request, Response, NextFunction } from 'express';
const mongoose = require('mongoose');
import jwt from 'jsonwebtoken';
const User = mongoose.model('User');
const gm = require('gm').subClass({imageMagick: true});

import convertImage from '../helpers/convertImage';
import resizeImage from '../helpers/resizeImage';
import uploadFileS3 from '../helpers/uploadFileS3';
import deleteFileS3 from '../helpers/deleteFileS3';
import { transformImageName } from '../middleware/processUploads';

const PROFILE_IMG_FOLDER = 'public/uploads/profile';

const signup = async (req: Request, res: Response, next: NextFunction): Promise<any | void> => {
  const { username, password } = req.body;

  try {
    // Check if username already taken
    const checkAvailability = await User.find({ username: username });
    if (checkAvailability.length > 0) {
      return res.status(422).send({ message: 'Username already taken!' });
    }

    // Create new user
    const newUser = new User({ username, password });
    await newUser.save();

    // Issue json web token
    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET);

    res.status(200).send({ _id: newUser._id, username: newUser.username, authToken: token });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

const signin = async (req: Request, res: Response, next: NextFunction): Promise<any | void> => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(422).send({ message: 'Username and password can\'t be empty!' });
  }

  // Check if user exists
  const user = await User.findOne({ username });
  if (!user) {
    return res.status(422).send({ message: 'Invalid credentials!' });
  }

  try {
    // Check password and issue json web token
    await user.comparePassword(password);
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);

    res.send({ _id: user._id, username: user.username, authToken: token });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

const getAvatarImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.query;

    const user = await User.findOne({ _id: userId });

    res.status(200).send({ profileImage: user.avatar.medium });
  } catch(err) {
    console.log(err);
    next(err);
  }
};

const uploadAvatarImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { 
    const imageFile = req.file;
    let bufferOriginal = req.file.buffer;
    const mimeType = req.file.mimetype;
    const imageNameOriginal = transformImageName(imageFile);
    const imageNameSmall = transformImageName(imageFile, 'small');
    const imageNameMedium = transformImageName(imageFile, 'medium');
    const userId = req.body.userId;

    let oldImageNameOriginal: string,
        oldImageNameSmall: string,
        oldImageNameMedium: string;

    // Convert heic / heif images to jpg because jimp doesn't support format
    // Returns converted image buffer
    if (mimeType === 'image/heic') {
      // bufferOriginal = await convertImage(bufferOriginal);
      // A buffer can be passed instead of a filepath as well
      let bufferTest: any;

      console.log(req.file.filename)
      console.log(bufferOriginal)
        
        gm(bufferOriginal, req.file.filename)
          .resize(100, 100)
          .toBuffer('jpeg',function (err, buffer) {
            if (err) {
              console.log(err);
              return;
            }
            bufferTest = buffer;
            console.log(bufferTest)
            console.log('done!');
        });

    }

    // Create different size versions of original image 
    // Returns buffer output
    // const bufferSmall = await resizeImage(bufferOriginal, mimeType, 'small', next);
    // const bufferMedium = await resizeImage(bufferOriginal, mimeType, 'medium', next);

    // Get reference to old profile images to delete later
    const user = await User.findOne({ _id: userId });
    if (user.avatar.original) {
      oldImageNameOriginal = user.avatar.original;
      // oldImageNameMedium = user.avatar.medium;
      oldImageNameSmall = user.avatar.small;
    }

    // Upload TO AWS S3 bucket
    // Returns bucket image path
    await uploadFileS3(bufferOriginal, imageNameOriginal, mimeType, `${PROFILE_IMG_FOLDER}/original`, next);
    // await uploadFileS3(bufferSmall, imageNameSmall, mimeType,`${PROFILE_IMG_FOLDER}/small`, next);
    // await uploadFileS3(bufferMedium, imageNameMedium, mimeType, `${PROFILE_IMG_FOLDER}/medium`, next);

    await User.updateOne(
      { _id: userId },
      { avatar: {
        original: imageNameOriginal,
        small: imageNameSmall,
        medium: imageNameMedium,
      } }
    );

    res.status(200).send({ profileImage: imageNameMedium }); 

    // Delete old profile images
    if (oldImageNameOriginal) {
      deleteFileS3(oldImageNameOriginal, `${PROFILE_IMG_FOLDER}/original`);
      // deleteFileS3(oldImageNameSmall, `${PROFILE_IMG_FOLDER}/small`);
      // deleteFileS3(oldImageNameMedium, `${PROFILE_IMG_FOLDER}/medium`);
    }
  } catch (err) {
    console.log(err);
    next(err);
  }
};

const deleteAvatarImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { userId } = req.body;

  try {
    const user = await User.findOne({ _id: userId });
    if (user.avatar.original) {
      await deleteFileS3(user.avatar.original, `${PROFILE_IMG_FOLDER}/original`);
      await deleteFileS3(user.avatar.medium, `${PROFILE_IMG_FOLDER}/medium`);
      await deleteFileS3(user.avatar.small, `${PROFILE_IMG_FOLDER}/small`);
    }
    
    await User.updateOne(
      { _id: userId },
      { avatar: { original: '', small: '', medium: '' } }
    );

    res.status(200).send({ imageDeleted: true });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

export default {
  signup,
  signin,
  getAvatarImage,
  uploadAvatarImage,
  deleteAvatarImage
};