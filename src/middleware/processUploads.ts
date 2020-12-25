import multer from 'multer';

const MIME_TYPE = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/heic': 'heic'
};

const diskStorage = (destination) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const isValid = MIME_TYPE[file.mimetype];

      let error = new Error('Invalid mime type');
      if (isValid) error = null;

      cb(error, `./src/public/uploads/${destination}`);
    },
    filename: (req, file, cb) => {
      const name = file.originalname.split('.')[0];
      const ext = MIME_TYPE[file.mimetype];
      cb(null, name + '_' + Date.now() + '.' + ext);
    }
  })
};

const memoryStorage = () => {
  return multer.memoryStorage();
};

const transformImageName = (file: any, imageSize?: string) => {
  if (imageSize) {
    return `${file.originalname}_${Date.now()}_${imageSize}.${MIME_TYPE[file.mimetype]}`;
  } else {
    return `${file.originalname}_${Date.now()}.${MIME_TYPE[file.mimetype]}`;
  }

};

export {
  diskStorage,
  memoryStorage,
  transformImageName
};