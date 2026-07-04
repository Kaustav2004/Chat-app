import { MailtrapClient } from 'mailtrap';
import dotenv from 'dotenv';
dotenv.config();

const sendResetPasswordLink = async (email, title, link) => {
    const frontendUrl = process.env.BASE_URL;
    const TOKEN = process.env.MAILTRAP_API_TOKEN;
    const currentYear = new Date().getFullYear();
    
    if (!TOKEN) {
        console.error("❌ MAILTRAP_API_TOKEN is missing!");
        throw new Error("Mailtrap API token not configured");
    }

    try {
        const client = new MailtrapClient({ token: TOKEN });

        const frontendLink = `${frontendUrl}/resetPassWord/Newpass?token=${link}`;
        
        const result = await client.send({
            from: {
                email: process.env.SENDER_EMAIL || "hello@demomailtrap.co",
                name: process.env.SENDER_NAME || "Connekt",
            },
            to: [{ email: email }],
            subject: title,
            text: `Reset password Link --> ${frontendLink}. Valid for 10 minutes.`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Black+Ops+One&display=swap');
                    </style>
                </head>
                <body style="margin: 0; padding: 0; background-color: #0F172A; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                    <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #0F172A;">
                        <tr>
                            <td style="padding: 40px 30px 20px 30px; text-align: center;">
                                <h1 style="margin: 0; font-family: 'Black Ops One', 'Impact', 'Arial Black', 'Franklin Gothic Heavy', sans-serif; font-weight: 400; font-size: 32px; color: #F8FAFC; letter-spacing: -1px;">Connekt</h1>
                            </td>
                        </tr>
                        
                        <tr>
                            <td style="padding: 30px; background: linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(39, 52, 73, 0.6)); border-radius: 20px; border: 1px solid rgba(51, 65, 85, 0.3);">
                                <table role="presentation" style="width: 100%;">
                                    <tr>
                                        <td style="text-align: center; padding-bottom: 20px;">
                                            <div style="display: inline-block; width: 64px; height: 64px; background: linear-gradient(135deg, #6366F1, #818CF8); border-radius: 16px; text-align: center; line-height: 64px;">
                                                <span style="font-size: 32px;">🔐</span>
                                            </div>
                                        </td>
                                    </tr>
                                    
                                    <tr>
                                        <td style="text-align: center; padding-bottom: 12px;">
                                            <h2 style="margin: 0; font-size: 24px; color: #F8FAFC; font-weight: 700;">Password Reset Request</h2>
                                        </td>
                                    </tr>
                                    
                                    <tr>
                                        <td style="padding-bottom: 20px;">
                                            <p style="margin: 0; font-size: 15px; color: #94A3B8; line-height: 1.6; text-align: center;">Hello,</p>
                                        </td>
                                    </tr>
                                    
                                    <tr>
                                        <td style="padding-bottom: 24px;">
                                            <p style="margin: 0; font-size: 14px; color: #94A3B8; line-height: 1.6; text-align: center;">
                                                We received a request to reset the password for your Connekt account. Click the button below to create a new password.
                                            </p>
                                        </td>
                                    </tr>
                                    
                                    <tr>
                                        <td style="text-align: center; padding-bottom: 24px;">
                                            <a href="${frontendLink}" 
                                               style="display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, #6366F1, #818CF8); color: #F8FAFC; text-decoration: none; border-radius: 12px; font-size: 15px; font-weight: 600; letter-spacing: 0.5px; box-shadow: 0 8px 25px rgba(99, 102, 241, 0.35);"
                                               target="_blank">
                                                Reset Password
                                            </a>
                                        </td>
                                    </tr>
                                    
                                    <tr>
                                        <td style="padding-bottom: 24px; text-align: center;">
                                            <p style="margin: 0; font-size: 13px; color: #64748B; line-height: 1.6;">
                                                Or copy and paste this link into your browser:
                                            </p>
                                            <a href="${frontendLink}" 
                                               style="display: block; margin-top: 8px; padding: 12px 16px; background-color: rgba(30, 41, 59, 0.4); border: 1px solid rgba(51, 65, 85, 0.3); border-radius: 8px; color: #818CF8; font-size: 12px; text-decoration: none; word-break: break-all;"
                                               target="_blank">
                                                ${frontendLink}
                                            </a>
                                        </td>
                                    </tr>
                                    
                                    <tr>
                                        <td style="padding: 16px; background-color: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.15); border-radius: 12px;">
                                            <table role="presentation" style="width: 100%;">
                                                <tr>
                                                    <td style="vertical-align: top; width: 24px; padding-right: 12px;">
                                                        <span style="color: #EF4444; font-size: 16px;">⚠️</span>
                                                    </td>
                                                    <td>
                                                        <p style="margin: 0; font-size: 12px; color: #FCA5A5; line-height: 1.5;">
                                                            <strong style="color: #EF4444;">Security Notice:</strong> This link expires in 10 minutes. If you didn't request this password reset, please ignore this email or contact support immediately. Your account security is important to us.
                                                        </p>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        
                        <tr>
                            <td style="padding: 30px; text-align: center;">
                                <table role="presentation" style="width: 100%;">
                                    <tr>
                                        <td style="padding-bottom: 8px;">
                                            <p style="margin: 0; font-size: 12px; color: #64748B;">© ${currentYear} Connekt. All rights reserved.</p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <p style="margin: 0; font-size: 11px; color: #475569; line-height: 1.5;">
                                                This email was sent because a password reset was requested for your account.
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
            `,
            category: "Password Reset",
        });

        console.log("✅ Reset password email sent:", result);
        return result;
    } catch (err) {
        console.error("❌ Email sending failed:", err.message);
        throw err;
    }
}

export default sendResetPasswordLink;