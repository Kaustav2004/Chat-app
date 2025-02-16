import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const sendResetPasswordLink = async (email,title,link)=> {
    const frontendUrl=process.env.BASE_URL;
    try{
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL,
                pass: process.env.PASSWORDEMAIL,
            },
        });
        const frontendLink = `${frontendUrl}/resetPassWord/Newpass?token=${link}`;
        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: `${title}`,
            text: `Reset password Link -->  ${frontendLink} . 
                    Valid for 10 minutes. `,
        };

        const info = await transporter.sendMail(mailOptions);

        return info;
    }
    catch(err){
        console.log(err.message);
    }  
}
export default sendResetPasswordLink;