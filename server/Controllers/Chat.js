import User from '../Models/User.js';
import Group from '../Models/Group.js'
import { uploadCloudinary } from '../Util/uploadCloudinary.js';
import multer from 'multer';
import { deleteCloudinary } from '../Util/deleteCloudinary.js';
import path from 'path';
import fs from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import mongoose from "mongoose";

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
        const {socketId,status} = req.body;
        const response = await User.findOneAndUpdate({socketId:socketId},{
            currStatus:status
        },{new:true})

        return res.status(200).json({
            success:true,
            message:"status updated Successfully",
            response: response
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

export const updateSocket = async (req,res) => {
    const {emailId,socketId} = req.body;
    try {
        const response = await User.findOneAndUpdate({emailId:emailId},{
            socketId:socketId
        },{new:true});
        if(response){
            return res.status(200).json({
                success:true,
                message:"SocketId Update Successfully"
            })
        }
        else{
            return res.json({
                success:false,
                message:"error in updating socketId"
            })
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:error
        })
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

export const fetchGroupInfo = async (req,res) => {
    
    const {id} = req.body;

    try {
        const response = await Group.findById(id);
        return res.status(200).json({
            success:true,
            message:"Successfully fetched group info",
            response:response
        })
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:error
        })
    }
}

export const addMember = async (req,res) => {
    try {
        const {groupId,newMember} = req.body;

        // add in group
        const upadtedGroup = await Group.findByIdAndUpdate( groupId,
            { $push: { members: newMember } },
            { new: true } 
        );

        // add group in user
        const updatedUser = await User.findOneAndUpdate({emailId: newMember},
            { $push: { groups: upadtedGroup._id}},
            { new: true }
        )

        return res.status(200).json({
            success: true,
            message: "User added successfully"
        })

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:error
        })
    }
}

export const removeMember = async (req, res) => {
    const { groupId, member } = req.body;
    console.log(groupId,member);

    try {
        // Check if the group exists and if the member is in the group
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ success: false, message: "Group not found" });
        }
        if (!group.members.includes(member)) {
            return res.status(400).json({ success: false, message: "Member not in group" });
        }

        // Remove member from the group
        const updatedGroup = await Group.findByIdAndUpdate(
            groupId,
            { $pull: { members: member } },
            { new: true }
        );


        // Convert groupId to ObjectId for user update
        const objectGroupId = new mongoose.Types.ObjectId(groupId);

        // Remove group from user's groups array
        const updatedUser = await User.findOneAndUpdate(
            { emailId: member },
            { $pull: { groups: objectGroupId } },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: "User not found or group not in user's groups",
            });
        }

        console.log("Updated User:", updatedUser);

        // Send a success response
        return res.status(200).json({
            success: true,
            message: "User removed successfully",
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


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