import { promisify } from 'util';
import fs from 'fs';
import convert from 'heic-convert';
 
// Convert heic / heif images to jpg
const convertImage = async (inputBuffer: Buffer): Promise<Buffer> => {
  const outputBuffer = await convert({
    buffer: inputBuffer, 
    format: 'JPEG', 
    quality: 1 
  });
  
  return outputBuffer;
};

export default convertImage;