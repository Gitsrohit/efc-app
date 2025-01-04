// import multer from 'multer';
// import b2 from '../config/backblaze.js';
// // const path = require('path');

// const backblazeStorage = multer.memoryStorage();

// export const uploadToBackblaze = multer({
//   storage: backblazeStorage,
//   limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
// }).single('file');

// export const uploadFileToBackblaze = async (file) => {
//   try {
//     const uploadUrlResponse = await b2.getUploadUrl({
//       bucketId: process.env.BACKBLAZE_BUCKET_ID,
//     });

//     const uploadResponse = await b2.uploadFile({
//       uploadUrl: uploadUrlResponse.data.uploadUrl,
//       uploadAuthToken: uploadUrlResponse.data.authorizationToken,
//       fileName: `${Date.now()}-${file.originalname}`,
//       data: file.buffer,
//     });

//     return `https://f002.backblazeb2.com/file/${process.env.BACKBLAZE_BUCKET_NAME}/${uploadResponse.data.fileName}`;
//   } catch (error) {
//     console.error('Error uploading file to Backblaze:', error.message);
//     throw error;
//   }
// };

