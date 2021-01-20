import { NextFunction } from 'express';
import Jimp from 'jimp';
const gm = require('gm').subClass({imageMagick: true});

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

  gm(bufferInput, 'test.jpg')
    .resize(outputDimensions[0], outputDimensions[1])
    .toBuffer(function(err, buffer) {
      if (err) {
        console.log(err);
        next(err);
        return;
      } 

      console.log(buffer)
    });

  // function gmToBuffer (data) {
  //   return new Promise((resolve, reject) => {
  //     data.toBuffer((err, stdout, stderr) => {
  //       if (err) { return reject(err) }
  //       const chunks = []
  //       stdout.on('data', (chunk) => { chunks.push(chunk) })
  //       // these are 'once' because they can and do fire multiple times for multiple errors,
  //       // but this is a promise so you'll have to deal with them one at a time
  //       stdout.once('end', () => { resolve(Buffer.concat(chunks)) })
  //       stderr.once('data', (data) => { reject(String(data)) })
  //     })
  //   })
  // }

  return null;
};

export default resizeImage;