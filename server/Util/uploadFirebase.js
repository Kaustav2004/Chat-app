import {initializeApp, cert} from 'firebase-admin/app';
import {getStorage} from 'firebase-admin/storage';
import dotenv from 'dotenv';

dotenv.config();

import serviceAccount from '../Credentials/serviceAccount.json' assert { type: 'json' };
// const serviceAccount = require('../Credentials/serviceAccount.json');
const BUCKET_NAME = process.env.BUCKET_NAME;

initializeApp({
    credential: cert(serviceAccount),
    storageBucket: `${BUCKET_NAME}.appspot.com`
});

export const uploadFireBase = async (localFilePath, destFilePath) => {
    
    const bucket = getStorage().bucket();

    // Upload the file
    await bucket.upload(localFilePath, {
        destination: destFilePath,
    });
    const fileRef = bucket.file(destFilePath);

    // make publicly accessable
    await fileRef.makePublic();

    // public url
    const publicUrl = fileRef.publicUrl();

    return publicUrl;
}