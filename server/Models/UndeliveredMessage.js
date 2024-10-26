import mongoose from "mongoose";

const undeliveredMessageSchema = new mongoose.Schema({
    senderId:{
        type:String,
        required:true
    },
    receiverId:[{
        type:String,
        required:true
    }],
    message:{
        type:String,
        required:true
    },
    time:{
        type:Date,
        required:true,
        default:Date.now
    }
})

const UndeliverdMessage=mongoose.model("UndeliverdMessage",undeliveredMessageSchema);
export default UndeliverdMessage;