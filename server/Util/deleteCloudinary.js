import { v2 as cloudinaryV2 } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
cloudinaryV2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME ,
    api_key: process.env.CLOUDINARY_API_KEY ,
    api_secret: process.env.CLOUDINARY_API_SECRET ,
});

const getPublicIdFromUrl = (url) => {
    const urlParts = url.split('/');
    const versionAndPublicId = urlParts.slice(-2).join('/');
    const publicId = versionAndPublicId.split('.')[0];
    return publicId.replace(/v\d+\//, ''); // Remove version if present
};

// Define the uploadCloudinary function
export const deleteCloudinary = async (filePath) => {
    const publicId = getPublicIdFromUrl(filePath);
    // Upload the file to Cloudinary
    const result = await cloudinaryV2.uploader.destroy(publicId);

    return result;
};
