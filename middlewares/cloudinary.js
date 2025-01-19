// const cloudinary = require("cloudinary").v2;
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
    // cloud_name:process.env.CLOUD_NAME,
    cloud_name:'dhhxbqoab',
    // api_key:process.env.API_KEY, 
    api_key:'474532251776149', 
    // api_secret:process.env.API_SECRET,
    api_secret:'BhPIjssdZQgB_z7M2VCK76-dWgU',
})

// export const uploadFile = async(filePath,folderName)=>{
//     // try {
//     //     const result = await cloudinary.uploader.upload(filePath);
//     //     console.log(result);
//     //     return result;
//     // } catch (error) {
//     //     console.log(error.message);
//     // }
//     try {
//         const result = await cloudinary.uploader.upload(filePath, {
//             folder: folderName, 
//         });
//         return result.secure_url; 
//     } catch (error) {
//         console.error('Error uploading to Cloudinary:', error.message);
//         throw new Error('Image upload failed');
//     }
// }

// // export default uploadFile

export const uploadFile = (fileBuffer, folderName) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { folder: folderName },
            (error, result) => {
                if (error) {
                    console.error('Error uploading to Cloudinary:', error.message);
                    reject(new Error('Image upload failed'));
                } else {
                    resolve(result.secure_url); // Return the secure URL of the uploaded file
                }
            }
        );

        // Convert buffer to stream using streamifier
        streamifier.createReadStream(fileBuffer).pipe(uploadStream);
    });
};


