import { Request, Response, NextFunction } from 'express';
const mongoose = require('mongoose');
import fs from 'fs';

const User = mongoose.model('User');
import convertImage from '../helpers/convertImage';
import resizeImage from '../helpers/resizeImage';
import uploadFileS3 from '../helpers/uploadFileS3';
import deleteFileS3 from '../helpers/deleteFileS3';
import { transformImageName } from '../middleware/processUploads';

const getImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.query;

    const user = await User.findOne({ _id: userId });

    res.status(200).send({ profileImage: user.profile.image.medium.name });
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

    const profileImgFolder = 'public/uploads/profile';

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
    if (user.profile.image.original.name) {
      oldImageNameOriginal = user.profile.image.original.name;
      oldImageNameMedium = user.profile.image.medium.name;
      oldImageNameSmall = user.profile.image.small.name;
    }

    // Upload TO AWS S3 bucket
    // Returns bucket image path
    await uploadFileS3(bufferOriginal, imageNameOriginal, mimeType, `${profileImgFolder}/original`, next);
    await uploadFileS3(bufferSmall, imageNameSmall, mimeType,`${profileImgFolder}/small`, next);
    await uploadFileS3(bufferMedium, imageNameMedium, mimeType, `${profileImgFolder}/medium`, next);

    await User.updateOne(
      { _id: userId },
      { profile: {
        image: {
          original: {
            name: imageNameOriginal,
            path: `${process.env.S3_DATA_URL}/${profileImgFolder}/original/${imageNameOriginal}`
          },
          small: {
            name: imageNameSmall,
            path: `${process.env.S3_DATA_URL}/${profileImgFolder}/small/${imageNameSmall}`
          },
          medium: {
            name: imageNameMedium,
            path: `${process.env.S3_DATA_URL}/${profileImgFolder}/medium/${imageNameMedium}`
          }
        }
      } }
    );

    res.status(200).send({ 
      profileImage: imageNameMedium
    }); 

    // Delete old profile images
    if (oldImageNameOriginal) {
      deleteFileS3(oldImageNameOriginal, `${profileImgFolder}/original`);
      deleteFileS3(oldImageNameSmall, `${profileImgFolder}/small`);
      deleteFileS3(oldImageNameMedium, `${profileImgFolder}/medium`);
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

    const pathToFiles = [
      `${global.appRoot}/${user.profile.image.original.path}`,
      `${global.appRoot}/${user.profile.image.small.path}`,
      `${global.appRoot}/${user.profile.image.medium.path}`
    ];

    await User.updateOne(
      { _id: userId },
      { profile: {
        image: {
          original: {
            name: '',
            path: ''
          },
          small: {
            name: '',
            path: ''
          },
          medium: {
            name: '',
            path: ''
          }
        }
      } }
    );

    // Delete all profile image files
    for (let image of pathToFiles) {
      if (fs.existsSync(image)) {
        fs.unlink(image, (err) => {
          if (err) {
            console.log(err);
            next(err);
          }
        });
      }
    }

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