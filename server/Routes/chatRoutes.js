import express from 'express';
import { checkGroupName, checkUser, createGroup, deleteAccount, imageUpload, updateName, uploadMiddleware } from '../Controllers/Chat.js';

const router = express.Router();

router.post("/checkUser", checkUser);
router.post("/verifyGroup", checkGroupName);
router.post("/createGroup", createGroup);
router.post("/imageUpload",uploadMiddleware, imageUpload);
router.post("/updateName",updateName);
router.post("/deleteAccount",deleteAccount);

export default router;