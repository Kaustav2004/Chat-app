import express from 'express';
import { addMember, checkGroupName, checkUser, createGroup, deleteAccount, fetchGroupInfo, fetchStatus, getMyOfflineMessages, getUndeliveredMessages, imageUpload, removeMember, undeliveredMessageStore, updateName, updatePassword, updateSocket, updateStatus, uploadMiddleware } from '../Controllers/Chat.js';

const router = express.Router();

router.post("/checkUser", checkUser);
router.post("/updateSocket",updateSocket);
router.post("/verifyGroup", checkGroupName);
router.post("/createGroup", createGroup);
router.post("/imageUpload",uploadMiddleware, imageUpload);
router.post("/updateName",updateName);
router.post("/updatePassword",updatePassword);
router.post("/deleteAccount",deleteAccount);
router.post("/updateStatus",updateStatus);
router.post("/fetchStatus",fetchStatus);
router.post("/fetchGroupInfo",fetchGroupInfo);
router.post("/addMember",addMember);
router.post("/removeMember",removeMember);
router.post("/storeUndeliveredMessage",undeliveredMessageStore);
router.post("/getUndeliveredMessage",getUndeliveredMessages);
router.post("/getMyOfflineMessages",getMyOfflineMessages);

export default router;