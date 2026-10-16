import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import config from '../config';

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          'Invalid file type. Only JPEG, PNG, WEBP, and PDF documents are allowed.',
        ),
      );
    }
  },
});

export const uploadToCloudinary = async (
  fileBuffer: Buffer,
  folder: string,
  resourceType: 'image' | 'raw' | 'auto' = 'auto',
): Promise<string> => {
  if (
    !config.cloudinary.cloudName ||
    !config.cloudinary.apiKey ||
    !config.cloudinary.apiSecret ||
    config.cloudinary.cloudName === 'your_cloud_name'
  ) {
    return `https://res.cloudinary.com/demo/image/upload/${folder}/mock_${Date.now()}`;
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `devassess/${folder}`,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error('Cloudinary upload result missing'));
        resolve(result.secure_url);
      },
    );

    uploadStream.end(fileBuffer);
  });
};
