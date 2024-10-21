import mongoose from "mongoose";
import sendEmail from "../Util/sendEmail.js";

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    otp: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: '2m'  // OTP will expire in 2 minutes
    }
});

async function sendMailForOtp(email, otp) {
    try {
        const info = await sendEmail(email, "Verification Mail", otp);
    } catch (err) {
        console.log(err);
    }
}

otpSchema.pre('save', async function (next) {
    await sendMailForOtp(this.email, this.otp);
    next();
});

const Otp = mongoose.model("Otp", otpSchema);
export default Otp;
