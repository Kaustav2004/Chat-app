import User from '../Models/User.js';
import Group from '../Models/Group.js'

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

export const checkGroupName = async (req,res)=>{
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

export const createGroup = async (req,res)=>{
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