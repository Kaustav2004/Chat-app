import { v2 as cloudinaryV2 } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
cloudinaryV2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME ,
    api_key: process.env.CLOUDINARY_API_KEY ,
    api_secret: process.env.CLOUDINARY_API_SECRET ,
});

// Define the uploadCloudinary function
export const uploadCloudinary = async (filePath) => {
    // Set options for Cloudinary upload
    const options = {
        folder: process.env.CLOUDINARY_FOLDER_NAME,
        resource_type: "raw",
        allowed_formats:['jpg', 'jpeg', 'png', 'pdf', 'mp3', 'mp4' , 'wav', 'webm', 'ogg'],
        quality: 'auto:low',
    };

    // Upload the file to Cloudinary
    const uploadResult = await cloudinaryV2.uploader.upload(filePath, options);

    return uploadResult;
};
