import mongoose from "mongoose";

const undeliveredMessageSchema = new mongoose.Schema({
    senderId:{
        type:String,
        required:true
    },
    fullName:{
        type:String,
        required:true
    },
    receiverIds:[{
        type:String,
        required:true
    }],
    sentIds:[{
        type:String
    }],
    messageStoreId:{
        type:String,
        required:true
    },
    message:{
        type:String,
        required:true
    },
    messageId:{
        type:Number,
        required:true
    },
    time:{
        type:String,
        required:true
    },
    isSeen:{
        type:Boolean,
        required:true
    }
})

const UndeliverdMessage=mongoose.model("UndeliverdMessage",undeliveredMessageSchema);
export default UndeliverdMessage;