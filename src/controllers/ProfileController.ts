import { Request, Response, NextFunction } from 'express';
const mongoose = require('mongoose');
import fs from 'fs';

const User = mongoose.model('User');
import convertImage from '../helpers/convertImage';
import resizeImage from '../helpers/resizeImage';
import uploadFileS3 from '../helpers/uploadFileS3';
import { transformFileName } from '../middleware/processUploads';

const getImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.query;

    const user = await User.findOne({ _id: userId });

    res.status(200).send({ profileImage: user.profile.image.medium.path });
  } catch(err) {
    console.log(err);
    next(err);
  }
};

const uploadImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { 
    console.log(req.file)

    const imageFile = req.file;
    const bufferOriginal = req.file.buffer;
    const imageNameOriginal = transformFileName(imageFile);
    const userId = req.body.userId;

    const profileImgFolder = 'public/uploads/profile';

    // let splitNameParts = image.filename.split('.');
    // let fileExt = splitNameParts[splitNameParts.length - 1];
    // splitNameParts.pop();
    // const joinNameParts = splitNameParts.join('');

    // imageNameOriginal = image.filename;

  //   // Convert heic / heif images to jpg because jimp doesn't support format
  //   if (fileExt === 'heic' || fileExt === 'heif') {
  //     const originalImgPath = `${global.appRoot}/${profileImgFolder}/original/${imageNameOriginal}`;

  //     await convertImage(
  //       originalImgPath,
  //       `${global.appRoot}/${profileImgFolder}/original/${joinNameParts}.jpg`
  //     );

  //     imageNameOriginal = `${joinNameParts}.jpg`;

  //      // Delete original heic / heif file
  //     if (fs.existsSync(originalImgPath)) {
  //       fs.unlink(originalImgPath, (err) => {
  //         if (err) {
  //           console.log(err);
  //           next(err);
  //         }
  //       });
  //     }
  //   }

  //   // Create different size versions of original image and get buffer output and new image names
  //   const { 
  //     resizedImageName: imageNameSmall, 
  //     bufferOutput: bufferSmall 
  //   } = await resizeImage(imageNameOriginal, 'profile', 'small', next);
  //   const { 
  //     resizedImageName: imageNameMedium,
  //     bufferOutput: bufferMedium
  //   } = await resizeImage(imageNameOriginal, 'profile', 'medium', next);

    // UPLOAD TO AWS S3 bucket
    uploadFileS3(
      bufferOriginal,
      imageNameOriginal, 
      imageFile.mimetype, 
      `${profileImgFolder}/original`, 
      next
    );
  //   uploadFileS3(bufferSmall, imageNameSmall, image.mimetype,`${profileImgFolder}/small`, next);
  //   uploadFileS3(bufferMedium, imageNameMedium, image.mimetype, `${profileImgFolder}/medium`, next);

  //   const user = await User.findOne({ _id: userId });

  //   const pathToFiles = [
  //     `${global.appRoot}/${user.profile.image.original.path}`,
  //     `${global.appRoot}/${user.profile.image.small.path}`,
  //     `${global.appRoot}/${user.profile.image.medium.path}`
  //   ];

  //   await User.updateOne(
  //     { _id: userId },
  //     { profile: {
  //       image: {
  //         original: {
  //           name: imageNameOriginal,
  //           path: `${profileImgFolder}/original/${imageNameOriginal}`
  //         },
  //         small: {
  //           name: imageNameSmall,
  //           path: `${profileImgFolder}/small/${imageNameSmall}`
  //         },
  //         medium: {
  //           name: imageNameMedium,
  //           path: `${profileImgFolder}/medium/${imageNameMedium}`
  //         }
  //       }
  //     } }
  //   );

  //   // Delete old profile images
  //   for (let image of pathToFiles) {
  //     if (fs.existsSync(image)) {
  //       fs.unlink(image, (err) => {
  //         if (err) {
  //           console.log(err);
  //           next(err);
  //         }
  //       });
  //     }
  //   }
      res.status(200).send({ success: true });

    // res.status(200).send({ profileImage: `${profileImgFolder}/medium/${imageNameMedium}` }); 
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