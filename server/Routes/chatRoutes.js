import express from 'express';
import { checkGroupName, checkUser, createGroup } from '../Controllers/Chat.js';

const router = express.Router();

router.post("/checkUser", checkUser);
router.post("/verifyGroup", checkGroupName);
router.post("/createGroup", createGroup);

export default router;