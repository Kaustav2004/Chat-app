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
    password:{
        type:String,
        required:true
    }
})

const User=mongoose.model("User",userSchema);
export default  User;