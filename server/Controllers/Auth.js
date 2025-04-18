import Otp from '../Models/Otp.js';
import User from '../Models/User.js';
import otpGenerator from 'otp-generator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken'; 
import ResetPasswordToken from '../Models/ResetPasswordToken.js';
import { jwtDecode } from "jwt-decode";

// sendotp
export const sendOtp = async (req, res) => {
    try {
        const { email } = req.body;

        // Check if user already exists
        const userFind = await User.findOne({ email });
        if (userFind) {
            return res.status(401).json({
                success: false,
                message: "User already exists"
            });
        }

        // Generate OTP
        let otp = otpGenerator.generate(4, {
            lowerCaseAlphabets: false,
            specialChars: false,
            upperCaseAlphabets: false
        });

        // Check if OTP is unique
        let result = await Otp.findOne({ otp });
        while (result) {
            otp = otpGenerator.generate(4, {
                lowerCaseAlphabets: false,
                specialChars: false,
                upperCaseAlphabets: false
            });
            result = await Otp.findOne({ otp });
        }

        // Create OTP entry in DB
        await Otp.create({ email, otp });

        return res.status(200).json({
            success: true,
            message: "OTP sent successfully"
        });
    } catch (err) {
        console.error(err);  // Log the error for debugging
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
}

// signUp
export const signUp = async (req, res) => {
    try {
        const { name, userName, emailId, password, cnfPassword, otp } = req.body;

        // Validate data
        if (!name || !userName || !emailId || !password || !cnfPassword || !otp) {
            return res.status(400).json({
                success: false,
                message: "Please fill all fields"
            });
        }

        // Check if password and confirm password match
        if (password !== cnfPassword) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match"
            });
        }

        // Check if user already exists
        const findUser = await User.findOne({ emailId });
        if (findUser) {
            return res.status(400).json({
                success: false,
                message: "User already exists"
            });
        }

        // Validate OTP
        const otpFind = await Otp.find({email: emailId }).sort({ createdAt: -1 }).limit(1);
        console.log(otpFind);
        if (!otpFind || otpFind.length === 0 || otp !== otpFind[0].otp) {
            return res.status(400).json({
                success: false,
                message: "OTP does not match"
            });
        }

        // Hash password
        const hashPassword = await bcrypt.hash(password, 10);

        // Create new user
        await User.create({
            fullName: name,
            userName,
            emailId,
            password: hashPassword,
            profilePhoto: `https://api.dicebear.com/9.x/initials/svg?seed=${name}`
        });

        return res.status(200).json({
            success: true,
            message: "User created successfully"
        });
    } catch (err) {
        console.error(err);  // Log the error for debugging
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
}

// login
export const login = async (req, res) => {
    try {
        const { emailId, password } = req.body;

        // Validate inputs
        if (!emailId || !password) {
            return res.status(400).json({
                success: false,
                message: "Please fill all fields"
            });
        }

        // Check if user exists
        const user = await User.findOne({ emailId });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // check user is currently logged in or not
        if(user.socketId!=='None' && user.socketIdExpiry>Date.now()){
            return res.status(401).json({
                success:false,
                message:"Already logged in another device"
            })
        }
        
        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Incorrect password"
            });
        }

        // Create JWT token
        const token = jwt.sign({ id: user._id, email: user.emailId }, process.env.JWT_SECRET, {
            expiresIn: '12h'
        });

        // Send token as cookie
        res.cookie('token', token, {
            expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
            httpOnly: true
        });

        return res.status(200).json({
            success: true,
            message: "Logged in successfully",
            token
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
}

// reset Password Link send part
export const resetPassword = async (req,res) => {
    const {emailId} = req.body;

    // Check if user exists or not
    const userFind = await User.findOne({ emailId:emailId });
    if (!userFind) {
        return res.status(401).json({
            success: false,
            message: "User not exists"
        });
    }

    // genearte token and store it db
    const token = jwt.sign({ email: emailId }, process.env.JWT_SECRET, {
        expiresIn: '10m'
    });

    try {
        await ResetPasswordToken.create({emailId, token});

        return res.status(200).json({
            success:true,
            message:"Reset Link send to your emailId"
        })
    } catch (error) {
        return res.status(500).json({
            success:false,
            message: error
        })
    }
    
}

// reset password in DB
export const resetPasswordDB = async (req,res) => {
    const {token, password} = req.body;
    try {
        // verify token
        const tokenVerify = await ResetPasswordToken.findOneAndDelete({token:token});
        
        if(!tokenVerify){
            return res.status(404).json({
                success:false,
                message:"Token Expired.."
            })
        }

        // find email from token and verify with db email
        const decodedToken = jwtDecode(token);

        // password hash
        const hashPassword = await bcrypt.hash(password, 10);

        // upload to db
        const newUser = await User.findOneAndUpdate({emailId:decodedToken.email},{
            password:hashPassword
        })

        
        return res.status(200).json({
            success:true,
            message:"Password Updated Successfully"
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:error
        })
    }
    
}