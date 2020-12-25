import { NextFunction } from 'express';
import Jimp from 'jimp';

const resizeImage = async (
  bufferInput: Buffer,
  mimeType: string,
  outputSize: string,
  next: NextFunction
): Promise<Buffer> => {

  let outputDimensions: number[],
      bufferOutput: Buffer;

  if (outputSize === 'small') {
    outputDimensions = [120, 120];
  } else if (outputSize === 'medium') {
    outputDimensions = [400, 400];
  }

  await Jimp.read(bufferInput)
    .then(file => {
      return file
        .cover(outputDimensions[0], outputDimensions[1])
        .quality(60)
        .getBuffer(mimeType, (err, buffer) => {
          if (err) {
            console.log(err);
            next(err);
            return;
          }
          bufferOutput = buffer
        });
    })
    .catch(err => console.log(err));

  return bufferOutput; 
};

export default resizeImage;