import { NextFunction } from 'express';
const gm = require('gm').subClass({imageMagick: true});

const resizeImage = async (
  bufferInput: Buffer,
  mimeType: string,
  outputSize: string,
  next: NextFunction
): Promise<Buffer> => {

  let outputDimensions: number[];

  if (outputSize === 'small') {
    outputDimensions = [120, 120];
  } else if (outputSize === 'medium') {
    outputDimensions = [400, 400];
  }

  return new Promise((resolve, reject) => {
    gm(bufferInput)
      .resize(outputDimensions[0], outputDimensions[1])
      .toBuffer('jpeg', (err, buffer) => {
        if (err) { 
          console.log(err);
          next(err);
        };
        if (buffer) { 
          return resolve(buffer);
        }
    });
  });
};

export default resizeImage;