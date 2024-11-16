import express from 'express';
import { login, resetPassword, resetPasswordDB, sendOtp, signUp } from '../Controllers/Auth.js';

const router = express.Router();

router.post("/signUp", signUp);
router.post("/logIn", login);
router.post("/otp",sendOtp);
router.post("/resetPassword", resetPassword);
router.post("/resetPasswordDB", resetPasswordDB);

export default router;