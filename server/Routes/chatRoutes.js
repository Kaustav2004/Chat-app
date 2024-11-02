import express from 'express';
import { checkGroupName, checkUser, createGroup, deleteAccount, fetchStatus, imageUpload, updateName, updateStatus, uploadMiddleware } from '../Controllers/Chat.js';

const router = express.Router();

router.post("/checkUser", checkUser);
router.post("/verifyGroup", checkGroupName);
router.post("/createGroup", createGroup);
router.post("/imageUpload",uploadMiddleware, imageUpload);
router.post("/updateName",updateName);
router.post("/deleteAccount",deleteAccount);
router.post("/updateStatus",updateStatus);
router.post("/fetchStatus",fetchStatus);

export default router;