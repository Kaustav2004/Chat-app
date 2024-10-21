import express from 'express';
import { checkUser } from '../Controllers/Chat.js';

const router = express.Router();

router.post("/checkUser", checkUser);

export default router;