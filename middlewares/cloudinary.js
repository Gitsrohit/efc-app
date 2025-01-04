// const cloudinary = require("cloudinary").v2;
import { v2 as cloudinary } from 'cloudinary';
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