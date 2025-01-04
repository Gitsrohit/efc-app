// const cloudinary = require("cloudinary").v2;
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
    cloud_name:process.env.CLOUD_NAME,
    api_key:process.env.API_KEY, 
    api_secret:process.env.API_SECRET,
})

export const uploadFile = async(filePath,folderName)=>{
    // try {
    //     const result = await cloudinary.uploader.upload(filePath);
    //     console.log(result);
    //     return result;
    // } catch (error) {
    //     console.log(error.message);
    // }
    try {
        const result = await cloudinary.uploader.upload(filePath, {
            folder: folderName, 
        });
        return result.secure_url; 
    } catch (error) {
        console.error('Error uploading to Cloudinary:', error.message);
        throw new Error('Image upload failed');
    }
}

// export default uploadFile