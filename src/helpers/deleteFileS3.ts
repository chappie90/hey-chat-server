import { NextFunction } from "express";

const deleteFileS3 = async (
  filename: string,
  destinationFolder: string,
  next: NextFunction
): Promise<void> => {
  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: `${destinationFolder}/${filename}`
  };

  await global.s3.headObject(params).promise();
  console.log('Image found on s3');

  await global.s3.deleteObject(params).promise();
  console.log('Image deleted successfully');
};

export default deleteFileS3;