import mongoose from "mongoose";

const groupSchema = new mongoose.Schema({
    groupName:{
        type:String,
        required:true
    },
    members:[{
        type:String,
        required:true
    }],
    admins:[{
        type:String,
        required:true
    }],
    groupProfilePic:{
        type:String
    },
    messages:[{
        type:Object
    }],
    craetedAt:{
        type:Date,
        required:true,
        default:Date.now
    },
    updatedAt:{
        type:Date,
        required:true,
        default:Date.now
    }
})

const Group=mongoose.model("Group",groupSchema);
export default Group;