import mongoose from "mongoose";
import sendResetPasswordLink from "../Util/sendResetPasswordLink.js";

const resetPasswordTokenSchema = new mongoose.Schema({
    emailId:{
        type:String,
        required:true
    },
    token:{
        type:String,
        required:true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: '10m'  // Link will expire in 10 minutes
    }
})

async function sendMailForPasswordReset(emailId, token) {
    try {
        const info = await sendResetPasswordLink(emailId, "Reset Password Mail", token);
    } catch (err) {
        console.log(err);
    }
}

resetPasswordTokenSchema.pre('save', async function (next) {
    await sendMailForPasswordReset(this.emailId, this.token);
    next();
});

const ResetPasswordToken=mongoose.model("ResetPasswordToken",resetPasswordTokenSchema);
export default ResetPasswordToken;