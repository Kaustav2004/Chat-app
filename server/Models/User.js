import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    fullName:{
        type:String,
        required:true
    },
    userName:{
        type : String,
        required:true,
    },
    profilePhoto:{
        type:String,
    },
    emailId:{
        type:String,
        required:true
    },
    socketId:{
        type:String
    },
    socketIdExpiry: {
        type: Date
    },
    password:{
        type:String,
        required:true
    },
    chats:{
        type:Object
    },
    groups:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Group'
    }],
    currStatus:{
        type:String
    }
})

const User=mongoose.model("User",userSchema);
export default  User;