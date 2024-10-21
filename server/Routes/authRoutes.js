import express from 'express';
import { login, sendOtp, signUp } from '../Controllers/Auth.js';

const router = express.Router();

router.post("/signUp", signUp);
router.post("/logIn", login);
router.post("/otp",sendOtp);

export default router;