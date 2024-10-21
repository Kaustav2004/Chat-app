import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const sendEmail = async (email,title,otp)=> {
    try{
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL,
                pass: process.env.PASSWORDEMAIL,
            },
        });
        
        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: `${title}`,
            text: `Your OTP code is ${otp}. Expires in 2 minutes.`,
        };

        const info = await transporter.sendMail(mailOptions);

        return info;
    }
    catch(err){
        console.log(err.message);
    }  
}
export default sendEmail;