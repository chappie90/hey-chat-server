import { Request, Response, NextFunction } from 'express';
const mongoose = require('mongoose');

const User = mongoose.model('User');
import convertImage from '../helpers/convertImage';
import resizeImage from '../helpers/resizeImage';
import uploadFileS3 from '../helpers/uploadFileS3';
import deleteFileS3 from '../helpers/deleteFileS3';
import { transformImageName } from '../middleware/processUploads';

const PROFILE_IMG_FOLDER = 'public/uploads/profile';

const getImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.query;

    const user = await User.findOne({ _id: userId });

    res.status(200).send({ profileImage: user.avatar.medium });
  } catch(err) {
    console.log(err);
    next(err);
  }
};

const uploadImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
      bufferOriginal = await convertImage(bufferOriginal);
    }

    // Create different size versions of original image 
    // Returns buffer output
    const bufferSmall = await resizeImage(bufferOriginal, mimeType, 'small', next);
    const bufferMedium = await resizeImage(bufferOriginal, mimeType, 'medium', next);

    // Get reference to old profile images to delete later
    const user = await User.findOne({ _id: userId });
    if (user.avatar.original) {
      oldImageNameOriginal = user.avatar.original;
      oldImageNameMedium = user.avatar.medium;
      oldImageNameSmall = user.avatar.small;
    }

    // Upload TO AWS S3 bucket
    // Returns bucket image path
    await uploadFileS3(bufferOriginal, imageNameOriginal, mimeType, `${PROFILE_IMG_FOLDER}/original`, next);
    await uploadFileS3(bufferSmall, imageNameSmall, mimeType,`${PROFILE_IMG_FOLDER}/small`, next);
    await uploadFileS3(bufferMedium, imageNameMedium, mimeType, `${PROFILE_IMG_FOLDER}/medium`, next);

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
      deleteFileS3(oldImageNameSmall, `${PROFILE_IMG_FOLDER}/small`);
      deleteFileS3(oldImageNameMedium, `${PROFILE_IMG_FOLDER}/medium`);
    }
  } catch (err) {
    console.log(err);
    next(err);
  }
};

const deleteImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { userId } = req.body;

  try {
    const user = await User.findOne({ _id: userId });
    if (user.avatar.image.original) {
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
  getImage,
  uploadImage,
  deleteImage
};