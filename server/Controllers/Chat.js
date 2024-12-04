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
import UndeliverdMessage from '../Models/UndeliveredMessage.js';
import bcrypt from 'bcryptjs';

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
        const {groupName,members,groupProfilePic,admins} = req.body;
        
        const group = await Group.create({
            groupName,
            members,
            groupProfilePic,
            admins
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

export const makeAdmin = async (req,res) => {
    const {groupId, userId} = req.body;

    try {
        await Group.findByIdAndUpdate(groupId,
            { $push: { admins: userId } },
            {new:true}
        )
        return res.status(200).json({
            success:true
        })
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:error
        })
    }
   
}

export const removeAdmin = async (req,res) => {
    const {groupId, userId} = req.body;

    try {
        const group = await Group.findById(groupId);
        console.log("groupInfo")
        console.log(group);
        if(group.admins.length==1){
            return res.json({
                success:false,
                message:"Minimum one admin required"
            })
        }
        await Group.findByIdAndUpdate(groupId,
            { $pull: { admins: userId } },
            {new:true}
        )
        return res.status(200).json({
            success:true
        })
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:error
        })
    }
   
}

export const imageUpload = async (req,res) => {
    try {
        const file = req.file;
        const emailId = req.body.emailId;
        const prevURL = req.body.prevURL;
        const type = req.body.type;

        const filePath = path.join(uploadDir, file.filename);
        const url = await uploadCloudinary(filePath);

        // change in DB
        if(type=='Group'){
            await Group.findByIdAndUpdate(emailId,{
                groupProfilePic:url.secure_url
            })
        }
        else{
            await User.findOneAndUpdate({emailId:emailId},
                {profilePhoto:url.secure_url}
            )
        }
        

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

export const uploadFile = async (req,res) => {
    try {
        const file = req.file;
        const filePath = path.join(uploadDir, file.filename);
        const data = await uploadCloudinary(filePath);
        console.log(data);

        if (file.filename) {
            deleteImage(file.filename);
        }

        return res.status(200).json({
            success:true,
            message:"File uploaded Successfully",
            url:data.url
        })

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:error
        })
    }
}

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

export const updatePassword = async (req,res) => {
    const {prevPass, newPass, emailId} = req.body;

    try {
        // check prevpassword right or wrong
        const userInfo = await User.findOne({emailId:emailId});
        const isMatch = await bcrypt.compare(prevPass, userInfo.password);
        if(!isMatch){
            return res.status(400).json({
                success:false,
                message:"Your Current Password is wrong"
            })
        }

        const hashPassword = await bcrypt.hash(newPass, 10);
        const updatedUser = await User.findOneAndUpdate({emailId:emailId},{
            password:hashPassword
        },{new:true});

        return res.status(200).json({
            success:true,
            message:"Password Updated Successfully"
        })
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:error
        })
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
        let expiryTime = new Date(Date.now() + 12 * 60 * 60 * 1000);
        let currStatus = 'online';
        if(socketId==='None') {
            currStatus='offline';
            expiryTime=-1;
        }
        const response = await User.findOneAndUpdate({emailId:emailId},{
                socketId:socketId,
                socketIdExpiry: expiryTime,
                currStatus:currStatus
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

export const deleteGroup = async (req,res) => {
    const {groupId, userId} = req.body;

    try {
        // check group exist or not
        const group = await Group.findById(groupId);
        
        if(!group){
            return res.status(404).json({
                success:false,
                message: "Group is not exist"
            })
        }
        // userId is admin or not
        const isAdmin = group.admins.some(admin => admin === userId);

        if(!isAdmin){
            return res.status(401).json({
                success:false,
                message:"Only Admin can delete group"
            })
        }

        // remove groupId from all user profile
        await Promise.all(
            group.members.map(async (member) => {
                const user = await User.findOne({ emailId: member });
                if (user) {
                    const newGroups = user.groups.filter((group) => group !== groupId);
                    await User.findOneAndUpdate(
                        { emailId: member },
                        { groups: newGroups }
                    );
                }
            })
        );

        // remove dp
        await deleteCloudinary(group.groupProfilePic);

        // delete group
        await Group.findByIdAndDelete(groupId);

        res.status(200).json({
            success:true,
            message:"Group deleted successfully"
        })

    } catch (error) {
        return res.status(500).json({
            success:false,
            message:error
        })
    }
}

export const undeliveredMessageStore = async (req,res) => {
    const {senderId, fullName, receiverIds, message, messageId, time, type, isSeen, messageStoreId} = req.body;

    if (!senderId || !fullName || !receiverIds || receiverIds.length === 0 || !message || !messageId || !time || !type || !messageStoreId) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields",
        });
    }

    try {
        const undeliveredMessage = await UndeliverdMessage.create({
            senderId,
            fullName,
            receiverIds,
            message,
            messageId,
            time,
            type,
            isSeen,
            messageStoreId
        })
        
        return res.status(200).json({
            success:true,
            message:"Stored in DB",
            response:undeliveredMessage
        })

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"Problem in store in DB"
        })
    }
}

export const getUndeliveredMessages = async (req,res) => {

    const { receiverId } = req.body;

    if (!receiverId) {
      return res.status(400).json({ 
        message: "receiverId is required" 
      });
    }

    try {
        // Fetch messages where the receiverIds array contains the specified receiverId
        const messages = await UndeliverdMessage.find({
          receiverIds: receiverId,
        });
    
        // Send messages immediately to the client
        res.status(200).json({
          success: true,
          response: messages,
        });

        // mark all messages as isSeen true
        for (const message of messages) {
            // Remove the receiverId from the receiverIds array
            message.receiverIds = message.receiverIds.filter((id) => id !== receiverId);
    
            // If receiverIds is now empty, delete the message; otherwise, save the updated message
            if (message.receiverIds.length === 0) {
            await UndeliverdMessage.updateOne({ _id: message._id },{
                receiverIds:message.receiverIds,
                isSeen:true
            });
            } else {
            await message.save();
            }
        }
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:error
        })
    }

}

export const getMyOfflineMessages = async (req,res) => {
    const {senderId} = req.body;

    if(!senderId) {
        return res.status(400).json({
            success:false,
            message:"Required Field missing"
        })
    }

    try {
        const messages = await UndeliverdMessage.find({senderId:senderId});

        res.status(200).json({
            success:true,
            response:messages
        })

        // if isSeen true delete from DB
        for (const message of messages) {    
          // If receiverIds is now empty, delete the message; otherwise, save the updated message
          if (message.receiverIds.length === 0) {
            await UndeliverdMessage.deleteOne({ _id: message._id });
          }
        }

    } catch (error) {
        return res.status(500).json({
            success:false,
            message:error
        })
    }
   
}

export const groupMessageStore = async (req,res) => {
    const {message, groupId} = req.body;
    try {
        const addMessage = await Group.findByIdAndUpdate(groupId,
            {
                $push:{messages:message}
            }
        )
        
        if(addMessage){
            return res.status(200).json({
                success:true,
                message:"Message added successfully"
            })
        }
        return res.status(404).json({
            success:false,
            message:"Group not found"
        })

    } catch (error) {
        return res.status(500).json({
            success:false,
            message:error.message
        })
    }
}

export const fetchGroupMessages = async (req,res) => {
    const {groupId} = req.body;
    try {
        const groupInfo = await Group.findById(groupId);

        if(!groupInfo){
            return res.status(404).json({
                success:false,
                message: "This group is not available"
            })
        }

        return res.status(200).json({
            success:true,
            messages:groupInfo.messages
        })

    } catch (error) {
        return res.status(500).json({
            success:false,
            messages:error.message
        })
    }
}

export const backUpChat = async (req,res)=>{
    try{
        const {emailId,chats} = req.body;
        const updatedUser = await User.findOneAndUpdate({emailId: emailId},{
            chats:chats
        })

        if(updatedUser){
            return res.status(200).json({
                success:true,
                message:"Chats backed up successfully"
            })
        }

        return res.status(404).json({
            success:true,
            message:"Try again..."
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
