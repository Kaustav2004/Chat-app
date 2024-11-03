import User from '../Models/User.js';
import Group from '../Models/Group.js'
import { uploadCloudinary } from '../Util/uploadCloudinary.js';
import multer from 'multer';
import { deleteCloudinary } from '../Util/deleteCloudinary.js';
import path from 'path';
import fs from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

// Function to delete an image file
const deleteImage = (filename) => {
    const filePath = path.join(__dirname, '../uploads', filename);
    // console.log(filePath);

    fs.unlink(filePath, (err) => {
        if (err) {
            // console.error('Error deleting file:', err);
            return { success: false, message: 'File deletion failed.' };
        }
        // console.log('File deleted successfully:', filename);
    });
};

export const checkUser = async (req, res) => {
    try {
        const {emailId} = req.body;
        const response = await User.findOne({emailId:emailId}).populate("groups");
        console.log(response);
        if(response){
            response.password=undefined;
            return res.status(200).json({
                success:true,
                response:response,
                message:"User Found"
            })
        }
        else{
            return res.status(404).json({
                success:false,
                message:"User not exists"
            })
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

export const checkGroupName = async (req,res) => {
    try{
        const {groupName} = req.body;
        const response = await Group.findOne({groupName:groupName});

        if(response){
            return res.json({
                success:false,
                message:"Group name already registered"
            })
        }
        else{
            return res.status(200).json({
                success:true,
                message:""
            })
        }
    }
    catch(err){
        console.error(err);
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
}

export const createGroup = async (req,res) => {
    try{
        const {groupName,members,groupProfilePic} = req.body;
        
        const group = await Group.create({
            groupName,
            members,
            groupProfilePic
        });
        
        // Update each member to include this new group ID in their list of groups
        await Promise.all(
            members.map(async (emailId) => {
                await User.findOneAndUpdate(
                    {emailId:emailId},
                    { $push: { groups: group._id } },
                    { new: true }
                )
            })
        );

        return res.status(200).json({
            success:true,
            message:"Group Created Successfully",
            group:group
        })
    }
    catch(err){
        console.error(err);
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
}

export const imageUpload = async (req,res) => {
    try {
        const file = req.file;
        const emailId = req.body.emailId;
        const prevURL = req.body.prevURL;

        const filePath = path.join(uploadDir, file.filename);
        const url = await uploadCloudinary(filePath);

        // change in DB
        await User.findOneAndUpdate({emailId:emailId},
            {profilePhoto:url.secure_url}
        )

        if(prevURL){
            await deleteCloudinary(prevURL);
        }

        if (file.filename) {
            deleteImage(file.filename);
        }

        return res.status(200).json({
            success:true,
            message:"Image Updated",
            response:url.secure_url
        })
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
} 

export const uploadMiddleware = upload.single('file');

export const updateName = async (req,res) => {
    try {
        const {emailId,fullName} = req.body;
        
        await User.findOneAndUpdate({emailId:emailId},{
            fullName:fullName
        })

        return res.status(200).json({
            success:true,
            message:"Name Updated Successfully"
        })
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

export const deleteAccount = async (req,res) => {
    try {
        const {emailId} = req.body;
        const user = await User.findOne({emailId:emailId});
        const result = await User.findOneAndDelete({emailId:emailId});

        if (result) {
            // remove from all added group and delete dp from cloudinary
            const profilePic=user.profilePhoto;
            await deleteCloudinary(profilePic);

            // Remove user from all groups
            await Group.updateMany(
                { members: emailId },
                { $pull: { members: emailId } }
            );

            return res.status(200).json({
                success:true,
                message:"Account Deleted"
            })
        } else {
            return res.json({
                success:false,
                message:"Account not Deleted"
            })
        }
        

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

export const updateStatus = async (req,res)=>{
    try{
        const {emailId,status} = req.body;
        await User.findOneAndUpdate({emailId:emailId},{
            currStatus:status
        })

        return res.status(200).json({
            success:true,
            message:"updated Successfully"
        })

    }
    catch(err){
        console.error(err);
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
}

export const fetchStatus = async (req,res)=>{
    try{
        const {emailId} = req.body;
        const user = await User.findOne({emailId:emailId});
        console.log(user);
        return res.status(200).json({
            success:true,
            message:"fetched Successfully",
            status:user.currStatus
        })

    }
    catch(err){
        console.error(err);
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
}

export const backUpChat = async (req,res)=>{
    try{
        const {emailId,chats} = req.body;
        const fetchUser = await User.findOne({emailId:emailId});

    }
    catch(err){
        console.error(err);
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
}