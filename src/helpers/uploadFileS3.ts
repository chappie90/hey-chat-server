import { NextFunction } from "express";

const uploadFileS3 = async (
  buffer: Buffer, 
  filename: string,
  mimeType: string,
  destinationFolder: string,
  next: NextFunction
): Promise<void> => {
  
  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: `${destinationFolder}/${filename}`,
    Body: buffer,
    ContentType: mimeType
  };

  global.s3.upload(params, (err, data) => {
    if (err) {
      console.log(err);
      next(err);
      return;
    }
    console.log('Profile image uploaded successfully to S3');
  });
};

export default uploadFileS3;

