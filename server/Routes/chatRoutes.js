import express from 'express';
import { addMember, backUpChat, checkGroupName, checkUser, createGroup, deleteAccount, deleteGroup, fetchGroupInfo, fetchGroupMessages, fetchStatus, getMyOfflineMessages, getUndeliveredMessages, groupMessageStore, imageUpload, makeAdmin, removeAdmin, removeMember, undeliveredMessageStore, updateName, updatePassword, updateSocket, updateStatus, uploadFile, uploadMiddleware } from '../Controllers/Chat.js';

const router = express.Router();

router.post("/checkUser", checkUser);
router.post("/updateSocket",updateSocket);
router.post("/verifyGroup", checkGroupName);
router.post("/createGroup", createGroup);
router.post("/imageUpload",uploadMiddleware, imageUpload);
router.post('/fileUpload',uploadMiddleware, uploadFile);
router.post("/updateName",updateName);
router.post("/updatePassword",updatePassword);
router.post("/deleteAccount",deleteAccount);
router.post("/updateStatus",updateStatus);
router.post("/fetchStatus",fetchStatus);
router.post("/fetchGroupInfo",fetchGroupInfo);
router.post("/addMember",addMember);
router.post("/removeMember",removeMember);
router.post("/makeAdmin",makeAdmin);
router.post("/removeAdmin",removeAdmin);
router.post("/deleteGroup",deleteGroup);
router.post("/storeUndeliveredMessage",undeliveredMessageStore);
router.post("/getUndeliveredMessage",getUndeliveredMessages);
router.post("/getMyOfflineMessages",getMyOfflineMessages);
router.post("/groupMessageStore",groupMessageStore);
router.post("/fetchGroupMessages", fetchGroupMessages);
router.post("/backUpChat", backUpChat);

export default router;