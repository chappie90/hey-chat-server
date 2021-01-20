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

  function gmToBuffer (data) {
    return new Promise((resolve, reject) => {
      data.toBuffer((err, stdout, stderr) => {
        if (err) { return reject(err) }
        const chunks = []
        stdout.on('data', (chunk) => { chunks.push(chunk) })
        // these are 'once' because they can and do fire multiple times for multiple errors,
        // but this is a promise so you'll have to deal with them one at a time
        stdout.once('end', () => { resolve(Buffer.concat(chunks)) })
        stderr.once('data', (data) => { reject(String(data)) })
      })
    })
  }

  const data = gm(bufferInput).resize(outputDimensions[0], outputDimensions[1]);
  gmToBuffer(data)
    .then((res) => {
      console.log('ready');
      console.log(res);
    })
    .catch(e => console.log(e));

  return null;
};

export default resizeImage;