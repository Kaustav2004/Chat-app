import React, { useEffect, useState,useRef } from 'react';
import { io } from 'socket.io-client';
import { Avatar, Box, Button, Container, TextField, Typography, IconButton,InputAdornment,Tooltip,List,ListItem,ListItemText,Backdrop,CircularProgress } from '@mui/material';
import toast from 'react-hot-toast';
import { useParams, useNavigate } from 'react-router-dom';
import CloseIcon from '@mui/icons-material/Close';
import { useMediaQuery } from '@mui/material';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle';
import CheckCircleIcon from '@mui/icons-material/CheckCircle'; 
import DoneAllOutlinedIcon from '@mui/icons-material/DoneAllOutlined';
import { styled } from '@mui/material/styles';
import Badge from '@mui/material/Badge';
import EmojiPicker from 'emoji-picker-react'
import LogoutIcon from '@mui/icons-material/Logout';
import AttachFileOutlinedIcon from '@mui/icons-material/AttachFileOutlined';
import '@react-pdf-viewer/core/lib/styles/index.css';
import PdfPreview from '../Util/PdfViewer';
import BackupIcon from '@mui/icons-material/Backup';
import PublishIcon from '@mui/icons-material/Publish';

const ChatPage = ({emailIdCurr,logOutHandler}) => {
    const { emailId } = useParams();
    const BackendUrl = import.meta.env.VITE_BASE_URL;
    const navigate = useNavigate();
    const messagesEndRef = useRef(null);
    const localStorageChats = JSON.parse(localStorage.getItem(emailId));
    const myFullName = useRef('');
    const myProfilePic = useRef('');
    const sentMessageIds = useRef(new Set());
    const receiveMessageIds = useRef(new Set());
    const [socket, setSocket] = useState(null);
    const [receiverEmailID, setReceiverEmailID] = useState('');
    const [message, setMessage] = useState('');
    const [chats, setChats] = useState(localStorageChats);
    const [currEmailID, setCurrEmailID] = useState('');
    const [mainPageLoad, setmainPageLoad] = useState(false);
    const [openGroupForm, setopenGroupForm] = useState(false);
    const [showChatList, setShowChatList] = useState(true);
    const [groupFormData, setGroupFormData] = useState({
        groupName: '',
        members: [emailId],
        admins: [emailId]
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [emailInput, setEmailInput] = useState('');
    const [allRooms, setallRooms] = useState([emailId]);
    const [profileDetails, setprofileDetails] = useState(false);
    const [profileSkeleton, setprofileSkeleton] = useState(false);
    const [userDetails, setuserDetails] = useState('');
    const isSmallScreen = useMediaQuery('(max-width: 600px)');
    const emailInputRef = useRef(null);
    const [showImageFullscreen, setShowImageFullscreen] = useState(false);
    const [newMember, setnewMember] = useState('');
    const [isEmojiPickerVisible, setIsEmojiPickerVisible] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [fullscreenFileUrl, setFullscreenFileUrl] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [loadDp, setloadDp] = useState(false);
    const [backup, setBackup] = useState(false);

    const StyledBadge = styled(Badge)(({ theme }) => ({
        '& .MuiBadge-badge': {
          backgroundColor: '#44b700',
          color: '#44b700',
          boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
          '&::after': {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            animation: 'ripple 1.2s infinite ease-in-out',
            border: '1px solid currentColor',
            content: '""',
          },
        },
        '@keyframes ripple': {
          '0%': {
            transform: 'scale(.8)',
            opacity: 1,
          },
          '100%': {
            transform: 'scale(2.4)',
            opacity: 0,
          },
        },
      }));

    const GreyStyledBadge = styled(Badge)(({ theme }) => ({
    '& .MuiBadge-badge': {
        backgroundColor: '#b0b0b0',
        color: '#b0b0b0',
        boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    },
    }));
      
    useEffect(() => {
        if(emailId!==emailIdCurr){
            navigate('/auth');
            return;
        }
        setmainPageLoad(true);
        const newSocket = io(`${BackendUrl}`);
    
        const fetchUserInfo = async () => {
            try {
                const response = await fetch(`${BackendUrl}/api/v1/checkUser`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ emailId: emailId }),
                });
                const data = await response.json();

                if(!chats){
                    setChats(data.response.chats);
                }
                // Update profile info
                myFullName.current = data.response.fullName;
                myProfilePic.current = data.response.profilePhoto;

                const groups = data.response.groups;
                
                // Create a local Set to track the current groups
                const updatedGroups = new Set(groups.map(group => group._id));
                
                // Update allRooms with new group IDs
                setallRooms(() => {
                    const updatedRooms = {};
                    groups.forEach((group, index) => {
                        updatedRooms[index] = group._id;
                    });
                    updatedRooms[Object.keys(updatedRooms).length] = emailId;
                    return updatedRooms;
                });
                
                // Update chats
                setChats((prevChats) => {
                    const updatedChats = { ...prevChats };
                
                    // Add or update chats for current groups
                    groups.forEach(group => {
                        if (!updatedChats[group._id]) {
                            // Add new group
                            updatedChats[group._id] = {
                                type: 'Group',
                                messages: [],
                                lastMessage: {},
                                fullName: group.groupName,
                                groupId: group._id,
                                profilePhoto: group.groupProfilePic,
                                unreadMessages: 0,
                                members: group.members,
                                messageIds: new Set([]) ,
                                in: true
                            };
                        } else {
                            // Update profilePhoto for existing group
                            updatedChats[group._id].profilePhoto = group.groupProfilePic;
                            updatedChats[group._id]. messageIds = new Set([]) ;
                        }
                    });
                
                    // Remove chats that are no longer in the current groups
                    Object.keys(updatedChats).forEach(chatId => {
                        if (!updatedGroups.has(chatId) && updatedChats[chatId].type==='Group') {
                            delete updatedChats[chatId];
                        }
                    });
                
                    return updatedChats;
                });
                    
                // }
                
                await fetchChatStatuses(); // Call to fetch chat statuses

            } catch (error) {
                console.error('Error fetching user info:', error);
            } finally {
                setmainPageLoad(false);
            }
        };
    
        const fetchChatStatuses = async () => {
            if(!chats){
                try {
                    const promises = Object.keys(chats).map(async (email) => {
                        if(chats[email]?.type !== 'Group'){
                            const response = await fetch(`${BackendUrl}/api/v1/fetchStatus`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ emailId: email }),
                            });
            
                            // Check for response validity
                            if (!response.ok) {
                                throw new Error('Network response was not ok');
                            }
            
                            const data = await response.json();
                            return data.success ? { email, status: data.status } : null; // Return status
                        }
                        
                    });
        
                    // Wait for all promises to resolve
                    const results = await Promise.all(promises);
                    
                    // Update chats state with valid results
                    setChats((prevChats) => {
                        const updatedChats = { ...prevChats };
                        results.forEach((result) => {
                            if (result) {
                                updatedChats[result.email] = {
                                    ...updatedChats[result.email],
                                    status: result.status,
                                };
                            }
                        });
                        return updatedChats;
                    });
                } catch (error) {
                    console.error('Error fetching chat statuses:', error);
                }    
            }
            
        };

        const fetchUndeliveredMessages = async () => {
            try {
                const response = await fetch(`${BackendUrl}/api/v1/getUndeliveredMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ receiverId: emailId }),
                });
                const data = await response.json();

                if(data.success){
                    if(data.response && data.response.length>0){
                        data.response.forEach(msg => {
                            setChats((prevChats) => {
                                const updatedChats = { ...prevChats };
                                if (!updatedChats[msg.senderId]) {
                                    updatedChats[msg.senderId] = { messages: [], lastMessage: {},profilePhoto:'',unreadMessages:0,in:true};
                                }

                                // Check if the message already exists by its unique messageId
                                const messageExists = updatedChats[msg.senderId].messages.some(
                                    (m) => m.messageId === msg.messageId
                                );

                                if(!messageExists){
                                    updatedChats[msg.senderId].fullName = msg.fullName;
                                    const numOfUnreadMessage=updatedChats[msg.senderId].unreadMessages+1;
                                    updatedChats[msg.senderId].unreadMessages=numOfUnreadMessage;
                                    updatedChats[msg.senderId].messages.push({
                                        messageId: msg.messageId,
                                        message: msg.message,
                                        time: msg.time,
                                        type:msg.type,
                                        isSeen: false
                                    });
                
                                    updatedChats[msg.senderId].lastMessage = {
                                        message: msg.message,
                                        time: msg.time
                                    };
                                }
                               
                                return updatedChats;
                            });
                        });
                    }   
                }
            } catch (error) {
                console.log(error);
            }
        }

        const fetchMyOfflineMessagesStatus = async () => {
            try {
                const response = await fetch(`${BackendUrl}/api/v1/getMyOfflineMessages`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ senderId: emailId }),
                });
                const data = await response.json();

                if(data.success){
                    if(data.response){
                       data.response.forEach(msg => {
                        if(msg.isSeen){
                            setChats((prevChats) => {
                                const messages = prevChats[msg.messageStoreId]?.messages || [];
                                const messageIndex = messages.findIndex((message) => message.messageId === msg.messageId);
                                
                                if (messageIndex !== -1) {
                                    const updatedMessages = [...messages];
                                    updatedMessages[messageIndex] = { ...updatedMessages[messageIndex], isSeen: true };
                
                                    return {
                                        ...prevChats,
                                        [msg.messageStoreId]: {
                                            ...prevChats[msg.messageStoreId],
                                            messages: updatedMessages
                                        }
                                    };
                                }
                                return prevChats;
                            });
                        }
                       });
                    }
                }
            } catch (error) {
             console.log(error);   
            }
        }

        fetchUserInfo();
        fetchUndeliveredMessages();
        fetchMyOfflineMessagesStatus();

        // Socket event handlers
        newSocket.on('connect', () => {
            const updateStatus = async () =>{
                try {

                    const response1 = await fetch(`${BackendUrl}/api/v1/updateSocket`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ emailId: emailId, socketId: newSocket.id })
                    });
                    
                   const response = await fetch(`${BackendUrl}/api/v1/updateStatus`, {
                       method: 'POST',
                       headers: { 'Content-Type': 'application/json' },
                       body: JSON.stringify({ socketId: newSocket.id, status:"online" })
                   });
                } catch (error) {
                   console.log(error);
                }
            }
            updateStatus();
        });
    
        newSocket.on('disconnect', () => {
            console.log('Disconnected from the server');
        });
    
        newSocket.on('connect_error', (err) => {
            console.error('Connection Error:', err);
        });
    
        setSocket(newSocket); // Set the socket state
    
        return () => {
            newSocket.disconnect(); // Clean up the socket on unmount
        };
    }, []);
    
    useEffect(() => {
        if(Object.keys(allRooms).length>1){
            
            Object.keys(allRooms).map( async (room) => {
                if(chats[allRooms[room]] && chats[allRooms[room]]?.type==='Group'){
                    const response = await fetch(`${BackendUrl}/api/v1/fetchGroupMessages`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ groupId:allRooms[room]})
                    });
        
                    const data = await response.json();
        
                    if(data.success){
                        setChats((prevChats)=>{
                            const updatedChats = {...prevChats};

                            updatedChats[allRooms[room]].messages = [
                                ...data.messages.flat()  // Flatten the nested arrays
                            ];

                            const lastMessage = data.messages.flat().slice(-1)[0]; // Get the last message
                            updatedChats[allRooms[room]].lastMessage = lastMessage;

                            return updatedChats;
                        })
                    }
                }
                
            })
        }
       
    }, [allRooms])
    
    const toggleFullscreen = (fileUrl) => {
        setFullscreenFileUrl(fileUrl);
        setIsFullscreen(!isFullscreen);
    };

    const sendHandler = async (e) => {
        e.preventDefault();

        if(message==='') return;
        
        const messageId = Date.now();
        const timestamp = Date().split("GMT")[0].trim();

        if (!sentMessageIds.current.has(messageId)) {
            // Add the message ID to the Set
            sentMessageIds.current.add(messageId);

            // check user is online or offline
            // if user is in online
            if(chats[currEmailID].status==='online'){
                socket.emit('sendMessage', {
                    messageId: messageId,
                    sender: emailId,
                    receiver: currEmailID,
                    message: message,
                    time: timestamp,
                    type:'text',
                    fullName: myFullName.current,
                    isSeen: false
                });
            }
            

            // if user is offline
            else{
                // store in DB
                try {
                    const response = await fetch(`${BackendUrl}/api/v1/storeUndeliveredMessage`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            senderId: emailId,
                            receiverIds: [currEmailID],
                            message: message,
                            messageId:messageId,
                            time: timestamp,
                            type:'text',
                            fullName: myFullName.current,
                            isSeen:false,
                            messageStoreId:currEmailID
                        }),
                    });
                    const data = await response.json();

                    if(!data.success){
                        toast.error(`${data.message}`);
                    }

                } catch (error) {
                   toast.error(`${data.message}`);
                }
            }

            // Update chats state
            setChats((prevChats) => {
                const updatedChats = { ...prevChats };
                if (!updatedChats[currEmailID]) {
                    updatedChats[currEmailID] = { messages: [], lastMessage: {},unreadMessages:0, status:'' };
                }

                // check again
                const messageExists = updatedChats[currEmailID].messages.some(
                    msg => msg.messageId === messageId
                );

                if(!messageExists){
                    updatedChats[currEmailID].messages.push({
                        side: 'me',
                        messageId: messageId,
                        message: message,
                        time: timestamp,
                        type:'text',
                        isSeen: false
                    });
    
                    updatedChats[currEmailID].lastMessage = {
                        side: 'me',
                        message: message,
                        time: timestamp
                    };
                }
                
                // Clear message input immediately after sending
                setMessage('');
                return updatedChats;
            });
        }
    };

    const sendGroupMessage = async (e) => {
        e.preventDefault();
        const messageId = Date.now();
        const timestamp = Date().split("GMT")[0].trim();
        if (message !== '' && currEmailID) {
            if (!sentMessageIds.current.has(messageId)) {
                // Add the message ID to the Set
                sentMessageIds.current.add(messageId);

                socket.emit('sendGroupMessage', {
                    messageId: messageId,
                    groupName:currEmailID,
                    sender: emailId,
                    message: message,
                    time: timestamp,
                    fullName:myFullName.current,
                    type:'Normal Message'
                });

                setChats((prevChats) => {
                    const updatedChats = { ...prevChats };
                    if (!updatedChats[currEmailID]) {
                        updatedChats[currEmailID] = { messages: [], lastMessage: {}, messageIds: new Set([]) };
                    }

                    // check again -- O(1)
                    const messageExists = updatedChats[currEmailID]?.messageIds.has(messageId);

                    if(!messageExists){
                        updatedChats[currEmailID].messageIds.add(messageId);
                        updatedChats[currEmailID].messages.push({
                            side: 'me',
                            message: message,
                            time: timestamp,
                            messageId: messageId,
                        });
    
                        updatedChats[currEmailID].lastMessage = {
                            side: 'me',
                            message: message,
                            time: timestamp
                        };
                    }
                    
                    setMessage('');
                    return updatedChats;
                });

                // make message object
                const messageObject = [{
                    messageId: messageId,
                    sender:myFullName.current,
                    senderEmail: emailId,
                    message: message,
                    time: timestamp,
                    type:'Normal Message'
                }]

                // add to db also
                try {
                    await fetch(`${BackendUrl}/api/v1/groupMessageStore`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ groupId:currEmailID, message: messageObject })
                    });

                } catch (error) {
                    console.log(error);
                }
            }
        }
    };

    const changeHandler = (e) => {
        const tempMessage=e.target.value;
        tempMessage.trim();
        setMessage(tempMessage);
    };

    const onEmojiClick = (emojiObject) => {
        setMessage(prevMessage => prevMessage + emojiObject.emoji);
    };

    const roomChangeHandler = (e) => {
        setReceiverEmailID(e.target.value);
    };

    const getUserInfo = async (email)=> {

        try {
            const response = await fetch(`${BackendUrl}/api/v1/checkUser`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emailId: email })
            });

            const data = await response.json();
            
            setChats((prevChats) => {
                const updatedChats = { ...prevChats };
    
                if (updatedChats[email]) {
                    updatedChats[email].profilePhoto = data.response.profilePhoto;
                }
    
                return updatedChats;
            });

        } catch (error) {
            console.log(error);
        }
        
    }

    const startChatHandler = async (e) => {
        e.preventDefault();
        if (receiverEmailID !== '') {
            if(receiverEmailID===emailId){
                toast.error("It's Your email !!!");
                return;
            }
            try {
                const response = await fetch(`${BackendUrl}/api/v1/checkUser`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ emailId: receiverEmailID })
                });

                const data = await response.json();
                if (data.success) {
                    toast.success(`${data.message}`);
                    setCurrEmailID(receiverEmailID);
                     // Store the userName in chats if the email doesn't exist yet
                    setChats((prevChats) => {
                        const updatedChats = { ...prevChats };
                        if (!updatedChats[receiverEmailID]) {
                            updatedChats[receiverEmailID] = { messages: [], lastMessage: {}, fullName: data.response.fullName,profilePhoto:data.response.profilePhoto,unreadMessages:0 };
                        }
                        return updatedChats;
                    });

                    // Automatically hide chat list and show chat area on small screens
                    if (isSmallScreen) {
                        setShowChatList(false);
                    }
                } else {
                    toast.error(`${data.message}`);
                }
            } catch (error) {
                console.log(error);
            }
            setReceiverEmailID('');
        }
    };

    const currentEmailHandler = (email) => {
        setCurrEmailID(email);

        if (isSmallScreen) {
            setShowChatList(false);  // Hide chat list on small screens when a chat is selected
        }
    };

    const handleCloseGroupForm = () => {
        setopenGroupForm(false);
    };

    const newMemberChangeHandler = (e) => {
        setnewMember(e.target.value);
    }

    // Scroll to the bottom whenever the messages change
    useEffect(() => {
        // Ensure that currEmailID and the corresponding messages are available
        if (currEmailID && chats && chats[currEmailID] && chats[currEmailID].messages && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [currEmailID, chats]);

    useEffect(() => {
      localStorage.setItem(`${emailId}`, JSON.stringify(chats));
    }, [chats])

    useEffect(() => {
        // If emailFromUrl exists, add it to the members list when the component mounts
        if (emailId && !groupFormData.members.includes(emailId)) {
          setGroupFormData((prevData) => ({
            ...prevData,
            members: [...prevData.members, emailId]
          }));
        }
    }, [emailId]);
    
    // useEffect(() => {
    //     console.log("3"); 
    //     if (currEmailID && chats[currEmailID]) {
    //         if(chats[currEmailID]?.type === 'Group' && chats[currEmailID]?.unreadMessages>0){
    //             setChats( prevChats => {
    //                 const updatedMessages = [...prevChats[currEmailID].messages];
    //                 return {
    //                     ...prevChats,
    //                     [currEmailID]: {
    //                         ...prevChats[currEmailID],
    //                         unreadMessages:0,
    //                         messages: updatedMessages
    //                     }
    //                 };
    //             })
    //         }
    //         else{
    //             const allMessages = chats[currEmailID].messages || [];

    //         // Filter only received messages that are unread (to avoid marking sent messages as seen)
    //         const unreadMessages = allMessages.filter(
    //             message => message.isSeen === false && message.side !== 'me' // Ensure only received messages
    //         );
    //         let numOfUnreadMessage=chats[currEmailID].unreadMessages-unreadMessages.length;
    //         if(numOfUnreadMessage<0) numOfUnreadMessage=0;
    //         if (unreadMessages.length > 0) {
    //             unreadMessages.forEach(message => {
    //                 const messageId = message.messageId;
    
    //                 // Emit seen update only for the unread received messages
    //                 socket.emit('seenUpdate', { messageId, receiver: currEmailID, sender: emailId });
    
    //                 // Update isSeen locally after emitting to prevent re-emitting
    //                 setChats(prevChats => {
    //                     const updatedMessages = [...prevChats[currEmailID].messages];
    //                     const messageIndex = updatedMessages.findIndex(msg => msg.messageId === messageId);
    
    //                     if (messageIndex !== -1) {
    //                         updatedMessages[messageIndex] = {
    //                             ...updatedMessages[messageIndex],
    //                             isSeen: true
    //                         };
    //                     }
    
    //                     return {
    //                         ...prevChats,
    //                         [currEmailID]: {
    //                             ...prevChats[currEmailID],
    //                             unreadMessages:numOfUnreadMessage,
    //                             messages: updatedMessages
    //                         }
    //                     };
    //                 });
    //             });
    //          }
    //         }
            
    //     }
    // }, [currEmailID, chats, emailId, socket]);

    useEffect(() => {
        if (currEmailID && chats[currEmailID]) {
            // Check if it's a Group and if there are unread messages
            if (chats[currEmailID]?.type === 'Group' && chats[currEmailID]?.unreadMessages > 0) {
                setChats(prevChats => {
                    const updatedMessages = [...prevChats[currEmailID].messages];
                    
                    // Only update if unreadMessages count is greater than 0
                    if (prevChats[currEmailID].unreadMessages > 0) {
                        return {
                            ...prevChats,
                            [currEmailID]: {
                                ...prevChats[currEmailID],
                                unreadMessages: 0,
                                messages: updatedMessages
                            }
                        };
                    }
    
                    return prevChats; // No changes to apply
                });
            } else {
                const allMessages = chats[currEmailID].messages || [];
    
                // Filter unread messages that are received (not sent by 'me')
                const unreadMessages = allMessages.filter(
                    message => message.isSeen === false && message.side !== 'me'
                );
    
                let numOfUnreadMessage = chats[currEmailID].unreadMessages - unreadMessages.length;
                numOfUnreadMessage = Math.max(numOfUnreadMessage, 0);
    
                // Only update if there are unread messages
                if (unreadMessages.length > 0) {
                    unreadMessages.forEach(message => {
                        const messageId = message.messageId;
    
                        // Emit seen update for unread received messages
                        socket.emit('seenUpdate', { messageId, receiver: currEmailID, sender: emailId });
    
                        // Update `isSeen` locally after emitting to prevent re-emitting
                        setChats(prevChats => {
                            const updatedMessages = [...prevChats[currEmailID].messages];
                            const messageIndex = updatedMessages.findIndex(msg => msg.messageId === messageId);
    
                            if (messageIndex !== -1) {
                                updatedMessages[messageIndex] = {
                                    ...updatedMessages[messageIndex],
                                    isSeen: true
                                };
                            }
    
                            // Only update if the messages are actually changed
                            if (prevChats[currEmailID].unreadMessages !== numOfUnreadMessage) {
                                return {
                                    ...prevChats,
                                    [currEmailID]: {
                                        ...prevChats[currEmailID],
                                        unreadMessages: numOfUnreadMessage,
                                        messages: updatedMessages
                                    }
                                };
                            }
    
                            return prevChats; // No changes to apply
                        });
                    });
                }
            }
        }
    }, [currEmailID, chats, emailId, socket]);
    
    const toggleChatList = () => {
        setCurrEmailID();
        setShowChatList(true);
    };

    const handleGroupNameChange = (event) => {
        // setIsGroupNameVerified(false);
        setGroupFormData({ ...groupFormData, groupName: event.target.value });
    };

    const handleEmailInputChange = (event) => {
        setEmailInput(event.target.value);
    };

    const handleAddMember = async () => {
        if(!groupFormData.members.includes(emailInput)){
            try {
                // Call the backend API to check if the email exists
                const response = await fetch(`${BackendUrl}/api/v1/checkUser`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ emailId: emailInput })
                });
          
                const result = await response.json();
                
                if (result.success) {
                  // If user exists, add to the members list
                  setGroupFormData((prevData) => ({
                    ...prevData,
                    members: [...prevData.members, emailInput]
                  }));
                  setEmailInput('');
                  setError('');
                } else {
                  setError('User does not exist');
                }
            } catch (error) {
                console.error('Error checking user:', error);
                setError('Error checking user');
            }
        }
        else{
            setError('User already added');
        }
        
    }; 

    const handleRemoveMember = (emailToRemove) => {
        if(emailToRemove!==emailId){
            setGroupFormData((prevData) => ({
                ...prevData,
                members: prevData.members.filter((email) => email !== emailToRemove)
            }));
            setError('');
        }
        else{
            setError("You have to join..")
        }
        
        
    };
    
    const handleCreateGroup = async () => {
        setLoading(true);

        if(groupFormData.groupName.trim() && groupFormData.members.length>2){

            // join all members in same group
            const groupName = groupFormData.groupName.trim();
            const members = groupFormData.members;
            const admins = groupFormData.admins;

            // db call for store group data
            try {
                const response = await fetch(`${BackendUrl}/api/v1/createGroup`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(
                        { 
                            groupName: groupName,
                            members:members,
                            groupProfilePic:`https://api.dicebear.com/9.x/initials/svg?seed=${groupName}`,
                            admins: admins
                        })
                });
            
                const result = await response.json();
                if(result.success){
                    setChats((prevChats) => {
                        const updatedChats = { ...prevChats };
                        if (!updatedChats[result.group._id]) {
                            updatedChats[result.group._id] = {type:'Group',messages: [], lastMessage: {}, fullName:result.group.groupName,profilePhoto:result.group.
                            groupProfilePic,groupId:result.group._id,
                            members:result.group.members,
                            unreadMessages:0 ,
                            in:true, 
                            messageIds: new Set([]) };
                        }
                        return updatedChats;
                    });
        
                    setallRooms((prevRooms) => {
                        const updatedRooms = { ...prevRooms };
        
                        // Get the next index (numeric key)
                        const nextIndex = Object.keys(updatedRooms).length;
        
                        // Add the new email/groupName at the next index
                        updatedRooms[nextIndex] = result.group._id;
        
                        return updatedRooms;
                    });

                    Object.entries(members).map(([key,emailid])=>{
                        if(emailid!==emailId){
                            socket.emit('notify', {
                                emailId:emailid,
                                groupId:result.group._id,
                                groupName:groupName
                            });
                        }
                    });

                    toast.success(`${result.message}`)

                }

                else{
                    toast.error(`${result.message}`);
                }

            } catch (error) {
                toast.error('Something Went Wrong');
            }

            setEmailInput('');
            setError('');
            setGroupFormData({
                groupName: '',
                members: [emailId]
            });

            setLoading(false);
            handleCloseGroupForm();
        }
        else {
            setError('Add more members...')
            setLoading(false);
        }
       
    };

    const handleFetchUserInfo = async (email) =>{
        setprofileSkeleton(true);

        try {
            const response = await fetch(`${BackendUrl}/api/v1/checkUser`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emailId: email })
            });

            const data = await response.json();

            if(data.success){
                setuserDetails({
                    fullName:data.response.fullName,
                    userName:data.response.userName,
                    emailID:data.response.emailId,
                    profilePic:data.response.profilePhoto,
                })
                setprofileDetails(true);
            }
            else{
                toast.error(`${data.message}`);
            }

        } catch (error) {
            toast.error(`${error}`);
        }

        setprofileSkeleton(false);
    }

    const handleFetchGroupInfo = async (groupId) =>{
        setprofileSkeleton(true);

        try {
            const response = await fetch(`${BackendUrl}/api/v1/fetchGroupInfo`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: groupId })
            });

            const data = await response.json();

            if(data.success){
                const adminSet = new Set(data.response.admins);
                setuserDetails({
                    fullName:data.response.groupName,
                    profilePic:data.response.groupProfilePic,
                    members:data.response.members,
                    created:data.response.createdAt,
                    updated:data.response.updatedAt,
                    adminSet:adminSet
                })
                setprofileDetails(true);
            }
            else{
                toast.error(`${data.message}`);
            }

        } catch (error) {
            toast.error(`${error}`);
        }

        setprofileSkeleton(false);
    }

    const addMemberHandler = async () => {
        // first find new member is in db or not
        try {
            const response = await fetch(`${BackendUrl}/api/v1/checkUser`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emailId: newMember })
            });

            const data = await response.json();

            // check group id and is the user is already in group
            const response2 = await fetch(`${BackendUrl}/api/v1/fetchGroupInfo`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: currEmailID })
            });

            const data2 = await response2.json();
            if(!data2.success){
                toast.error(`${data2.message}`);
                setnewMember('');
                return;
            }
            else{
                // check user is already added or not
                if(data2.response.members.includes(newMember)){
                    toast.success("User added already");
                    setnewMember('');
                    return;
                }
            }
            if(data.success){
                try {
                    const response = await fetch(`${BackendUrl}/api/v1/addMember`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ groupId: currEmailID, newMember: newMember })
                    });
        
                    const data = await response.json();
                    
                    if(data.success){
                        const timestamp = Date().split("GMT")[0].trim();

                        socket.emit('sendGroupMessage', {
                            groupName:currEmailID,
                            sender: emailId,
                            message: `${newMember} added by ${emailId}`,
                            time: timestamp,
                            fullName:myFullName.current,
                            type:'AlertMessage'
                        });
                        toast.success(`${data.message}`);
                    }
                    else{
                        toast.error(`${data.message}`);
                    }
        
                } catch (error) {
                    toast.error(`${error}`);
                }
            }
            else{
                toast.error("User not exists");
            }
            setnewMember('');
        } catch (error) {
            setnewMember();
            toast.error(`${error}`);
        }
    }

    const removeMemberHandler = async () => {
        // first find member is in db or not
        try {
            const response = await fetch(`${BackendUrl}/api/v1/checkUser`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emailId: newMember })
            });

            const data = await response.json();

            // check group id and is the user is in group or not
            const response2 = await fetch(`${BackendUrl}/api/v1/fetchGroupInfo`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: currEmailID })
            });

            const data2 = await response2.json();
            if(!data2.success){
                toast.error(`${data2.message}`);
                setnewMember('');
                return;
            }
            else{
                // check user is already added or not
                if(!data2.response.members.includes(newMember)){
                    toast.success("User removed already");
                    setnewMember('');
                    return;
                }
            }
            if(data.success){
                try {
                    const response = await fetch(`${BackendUrl}/api/v1/removeMember`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ groupId: currEmailID, member: newMember })
                    });
        
                    const data = await response.json();
                    
                    if(data.success){
                        const timestamp = Date().split("GMT")[0].trim();
                        socket.emit('sendGroupMessage', {
                            groupName:currEmailID,
                            sender: emailId,
                            message: `${newMember} removed by ${emailId}`,
                            time: timestamp,
                            fullName:myFullName.current,
                            type:'AlertMessage'
                        });
                        socket.emit('disableUser',{
                            groupName:currEmailID,
                            user:newMember
                        })
                        toast.success(`${data.message}`);
                    }
                    else{
                        toast.error(`${data.message}`);
                    }
        
                } catch (error) {
                    toast.error(`${error}`);
                }
            }
            else{
                toast.error("User is not exist");
            }
            setnewMember('');
        } catch (error) {
            setnewMember();
            toast.error(`${error}`);
        } 
    }

    const leftGroupHandler = async () => {
        // first find member is in db or not
        try {
            const response = await fetch(`${BackendUrl}/api/v1/checkUser`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emailId: emailId })
            });

            const data = await response.json();

            // check group id and is the user is in group or not
            const response2 = await fetch(`${BackendUrl}/api/v1/fetchGroupInfo`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: currEmailID })
            });

            const data2 = await response2.json();
            if(!data2.success){
                toast.error(`${data2.message}`);
                return;
            }
            else{
                // check user is already added or not
                if(!data2.response.members.includes(emailId)){
                    toast.success("User removed already");
                    return;
                }
            }
            if(data.success){
                try {
                    const response = await fetch(`${BackendUrl}/api/v1/removeMember`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ groupId: currEmailID, member: emailId })
                    });
        
                    const data = await response.json();
                    
                    if(data.success){
                        const timestamp = Date().split("GMT")[0].trim();
                        socket.emit('sendGroupMessage', {
                            groupName:currEmailID,
                            sender: emailId,
                            message: `${emailId} left the group`,
                            time: timestamp,
                            fullName:myFullName.current,
                            type:'AlertMessage'
                        });

                        toast.success(`${data.message}`);
                    }
                    else{
                        toast.error(`${data.message}`);
                    }
        
                } catch (error) {
                    toast.error(`${error}`);
                }
            }
            else{
                toast.error("User is not exist");
            }
            setnewMember('');
        } catch (error) {
            setnewMember();
            toast.error(`${error}`);
        } 
    }

    const makeAdminHandler = async () => {
        try {
            // check user is in group or not
            const response1 = await fetch(`${BackendUrl}/api/v1/fetchGroupInfo`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: currEmailID })
            });

            const data1 = await response1.json();
            if(!data1.success){
                toast.error(`${data1.message}`);
                setnewMember('');
                return;
            }
            else{
                // check user is already added or not
                if(data1.response.members.includes(newMember) && !data1.response.admins.includes(newMember)){
                   try {
                        const response = await fetch(`${BackendUrl}/api/v1/makeAdmin`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ groupId:currEmailID,userId: newMember })
                        });
            
                        const data = await response.json();
            
                        if(!data.success){
                            toast.error("Can't make admin");
                        }
                        else{
                            toast.success("Done");
                        }
                   } catch (error) {
                        console.log(error);
                   }
                   
                }else{
                    toast.error("Can't make admin");
                }
            }
            setnewMember('');
 
        } catch (error) {
            console.log(error);
        }
    }

    const removeAdminHandler = async () => {
        try {
            // check user is in group or not
            const response1 = await fetch(`${BackendUrl}/api/v1/fetchGroupInfo`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: currEmailID })
            });

            const data1 = await response1.json();
            if(!data1.success){
                toast.error(`${data1.message}`);
                setnewMember('');
                return;
            }
            else{
                // check user is already added or not
                if(data1.response.admins.includes(newMember)){
                   try {
                        const response = await fetch(`${BackendUrl}/api/v1/removeAdmin`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ groupId:currEmailID,userId: newMember })
                        });
            
                        const data = await response.json();
            
                        if(!data.success){
                            toast.error("Can't remove from admin");
                        }
                        else{
                            toast.success("Done");
                        }
                   } catch (error) {
                        console.log(error);
                   }
                   
                }
                else{
                    toast.error("Can't make admin");
                }
            }
            setnewMember('');
 
        } catch (error) {
            console.log(error);
        }
    }

    const fileUploadHandler = async(event) => {
        setIsUploading(true);
        const file = event.target.files[0];
        if (file.size > 5 * 1024 * 1024) {
            toast.error('File size exceeds 5MB!');
            return;
        }
        if (file) {
            
            const formData = new FormData();
            formData.append('file', file);

            // make backend call and recieve url will set on profilePic
            try {
                const response = await fetch(`${BackendUrl}/api/v1/fileUpload`, {
                    method: 'POST',
                    body: formData,
                });
        
                const data = await response.json();

                const messageId = Date.now();
                const timestamp = Date().split("GMT")[0].trim();
        
                if (!sentMessageIds.current.has(messageId)) {
                    // Add the message ID to the Set
                    sentMessageIds.current.add(messageId);
        
                    // check user is online or offline
                    // if user is in online
                    if(chats[currEmailID].status==='online'){
                        socket.emit('sendMessage', {
                            messageId: messageId,
                            sender: emailId,
                            type:'file',
                            receiver: currEmailID,
                            message: data.url,
                            time: timestamp,
                            fullName: myFullName.current,
                            isSeen: false
                        });
                    }
                    
        
                    // if user is offline
                    else{
                        // store in DB
                        try {
                            const response1 = await fetch(`${BackendUrl}/api/v1/storeUndeliveredMessage`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ 
                                    senderId: emailId,
                                    receiverIds: [currEmailID],
                                    message: data.url,
                                    type: 'file',
                                    messageId:messageId,
                                    time: timestamp,
                                    fullName: myFullName.current,
                                    isSeen:false,
                                    messageStoreId:currEmailID
                                }),
                            });
                            const data1 = await response1.json();
        
                            if(!data1.success){
                                toast.error(`${data1.message}`);
                            }
        
                        } catch (error) {
                           toast.error(`${data.message}`);
                        }
                    }
        
                    // Update chats state
                    setChats((prevChats) => {
                        const updatedChats = { ...prevChats };
                        if (!updatedChats[currEmailID]) {
                            updatedChats[currEmailID] = { messages: [], lastMessage: {},unreadMessages:0, status:'' };
                        }
        
                        // check again
                        const messageExists = updatedChats[currEmailID].messages.some(
                            msg => msg.messageId === messageId
                        );
        
                        if(!messageExists){
                            updatedChats[currEmailID].messages.push({
                                side: 'me',
                                type: 'file',
                                messageId: messageId,
                                message:  data.url,
                                time: timestamp,
                                isSeen: false
                            });
            
                            updatedChats[currEmailID].lastMessage = {
                                side: 'me',
                                message: message,
                                time: timestamp
                            };
                        }
                        
                        // Clear message input immediately after sending
                        setMessage('');
                        return updatedChats;
                    });
                }


            } catch (error) {
                console.log(error);
            }  finally {
                setIsUploading(false);
            }

        }
    }

    const groupFileUploadHandler = async(event) => {
        setIsUploading(true);
        const file = event.target.files[0];
        if (file.size > 5 * 1024 * 1024) {
            toast.error('File size exceeds 5MB!');
            return;
        }
        if (file) {
            
            const formData = new FormData();
            formData.append('file', file);

            // make backend call and recieve url will set on profilePic
            try {
                const response = await fetch(`${BackendUrl}/api/v1/fileUpload`, {
                    method: 'POST',
                    body: formData,
                });
        
                const data = await response.json();

                const messageId = Date.now();
                const timestamp = Date().split("GMT")[0].trim();

                if (!sentMessageIds.current.has(messageId)) {
                    // Add the message ID to the Set
                    sentMessageIds.current.add(messageId);
                    
                    // emit message
                    socket.emit('sendGroupMessage', {
                        messageId: messageId,
                        groupName:currEmailID,
                        sender: emailId,
                        message: data.url,
                        time: timestamp,
                        fullName:myFullName.current,
                        type:'file'
                    });

                    // update chat state
                    setChats((prevChats) => {
                        const updatedChats = { ...prevChats };
                        if (!updatedChats[currEmailID]) {
                            updatedChats[currEmailID] = { messages: [], lastMessage: {}, messageIds: new Set([]) };
                        }
    
                        // check again -- O(1)
                        const messageExists = updatedChats[currEmailID]?.messageIds.has(messageId);
    
                        if(!messageExists){
                            updatedChats[currEmailID].messageIds.add(messageId);
                            updatedChats[currEmailID].messages.push({
                                side: 'me',
                                message: data.url,
                                time: timestamp,
                                type:'file',
                                messageId: messageId,
                            });
        
                            updatedChats[currEmailID].lastMessage = {
                                side: 'me',
                                message: data.url,
                                time: timestamp
                            };
                        }
                        
                        return updatedChats;
                    });

                    // make message object
                    const messageObject = [{
                        messageId: messageId,
                        sender:myFullName.current,
                        senderEmail: emailId,
                        message: data.url,
                        time: timestamp,
                        type:'file'
                    }]

                    try {
                        await fetch(`${BackendUrl}/api/v1/groupMessageStore`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ groupId:currEmailID, message: messageObject })
                        });
    
                    } catch (error) {
                        console.log(error);
                    }
        
                }

            } catch (error) {
                console.log(error);
            }  finally {
                setIsUploading(false);
            }

        }
    }

    const deleteGroupHandler = async () => {
        try {
            const response = await fetch(`${BackendUrl}/api/v1/deleteGroup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ groupId: currEmailID, userId: emailId })
            });
    
            const data = await response.json();

            if(data.success){
                toast.success(`${data.message}`);
            }
            else{
                toast.error(`${data.message}`);
            }
        } catch (error) {
            toast.error('Try again ...');
        }
    }

    const handleImageChange = async (event) => {
        setloadDp(true);
        const file = event.target.files[0];
        if (file) {

            const formData = new FormData();
            formData.append('file', file);
            formData.append('emailId', currEmailID);
            formData.append('type', 'Group');
            formData.append('prevURL', userDetails.profilePic);

            // make backend call and recieve url will set on profilePic
            try {
                const response = await fetch(`${BackendUrl}/api/v1/imageUpload`, {
                    method: 'POST',
                    body: formData,
                });
        
                const data = await response.json();

                setuserData((prevData) => ({
                    ...prevData,
                    profilePic:data.response
                }));

                enqueueSnackbar('Profile picture updated!', { variant: 'success' });

            } catch (error) {
                console.log(error);
            }  

            setloadDp(false);
        }
    };

    const backUpHandler = async () => {
        setBackup(true);
        try {
            const response = await fetch(`${BackendUrl}/api/v1/backUpChat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emailId: emailId, chats:chats})
            });
    
            const data = await response.json();

            if(data.success){
               toast.success(`${data.message}`);
            }
            else{
                toast.error(`${data.message}`);
            }
        } catch (error) {
            console.log(error);
        } finally{
            setBackup(false);
        }
    }

    const logOutHandlerFunction = () => {
        io.emit("currStatus", { userId: emailId, status: "offline" })
        logOutHandler();
    }
    useEffect(() => {
        if (socket) {
            socket.on('receiveMessage', (data) => {
                if(!receiveMessageIds.current.has(data.messageId)){
                    receiveMessageIds.current.add(data.messageId);

                    setChats((prevChats) => {
                        const updatedChats = { ...prevChats };
                        if (!updatedChats[data.sender]) {
                            updatedChats[data.sender] = { messages: [], lastMessage: {},profilePhoto:'',unreadMessages:0,in:true};
                        }
    
                        updatedChats[data.sender].fullName = data.fullName;
    
                        const numOfUnreadMessage=updatedChats[data.sender].unreadMessages+1;
                        updatedChats[data.sender].unreadMessages=numOfUnreadMessage;
                        updatedChats[data.sender].messages.push({
                            messageId: data.messageId,
                            message: data.message,
                            time: data.time,
                            type:data.type,
                            isSeen: data.isSeen
                        });
    
                        updatedChats[data.sender].lastMessage = {
                            message: data.message,
                            time: data.time
                        };
    
                        return updatedChats;
                    });
                    getUserInfo(data.sender);
                }
                
            });

            socket.on('addGroup',(data)=>{
                const groupName=data.groupName;
                const groupId=data.groupId;

                // add group name in room
                setallRooms((prevRooms) => {
                    const updatedRooms = { ...prevRooms };
    
                    // Get the next index (numeric key)
                    const nextIndex = Object.keys(updatedRooms).length;
    
                    // Add the new email/groupName at the next index
                    updatedRooms[nextIndex] = data.groupId;
    
                    return updatedRooms;
                });

                // add in chats
                setChats((prevChats) => {
                    // later dp will fetched from db
                    const updatedChats = { ...prevChats };
                    if (!updatedChats[groupId]) {
                        updatedChats[groupId] = {type:'Group',messages: [], lastMessage: {}, fullName:groupName,groupId:groupId,profilePhoto:`https://api.dicebear.com/9.x/initials/svg?seed=${groupName}`,unreadMessages:0,
                        members:'',in:true, messageIds: new Set([])  };
                    }
                    return updatedChats;
                });

            })

            socket.on('receiveGroupMessage',(data) => {
                if (!receiveMessageIds.current.has(data.messageId)){

                    setChats((prevChats) => {
                        const updatedChats = { ...prevChats };

                        // check again
                        const messageExists = updatedChats[data.groupName].messageIds.has(data.messageId);

                        if(!messageExists){
                            updatedChats[data.groupName].messageIds.add(data.messageId);
                            const numOfUnreadMessage=updatedChats[data.groupName].unreadMessages+1;
                            updatedChats[data.groupName].unreadMessages=numOfUnreadMessage;
                            updatedChats[data.groupName].messages.push({
                                messageId:data.messageId,
                                sender:data.fullName,
                                senderEmail:data.sender,
                                message: data.message,
                                time: data.time,
                                type:data.type
                            });
        
                            updatedChats[data.groupName].lastMessage = {
                                message: data.message,
                                time: data.time
                            };
                        }
                        
                        return updatedChats;
                    });
                }
                
            })

            socket.on('currStatus',(data) => {
                setChats((prevChats) => {
                    const updatedChats = { ...prevChats };
                    if (updatedChats[data.userId]) {
                        updatedChats[data.userId].status = data.status;
                    }
                    return updatedChats;
                });
            })

            socket.on('disableGroup', (data) => {
                setallRooms((prevRooms)=> {
                    const updatedRooms = {...prevRooms};
                    const indexToRemove = Object.keys(updatedRooms).find(
                        (key) => updatedRooms[key] === data.groupName
                    );
                
                    // Remove the groupId if it exists in updatedRooms
                    if (indexToRemove !== undefined) {
                        delete updatedRooms[indexToRemove];
                    }
                
                    return updatedRooms;
                })

                setChats((prevChats) => {
                    const updatedChats = {...prevChats};
                    if(updatedChats[data.groupName]){
                        updatedChats[data.groupName].in=false;
                    }
                    return updatedChats;
                })
            })

            return () => {
                socket.off('receiveMessage');
                socket.off('addGroup');
                socket.off('receiveGroupMessage');
                socket.off('currStatus');
                socket.off('disableGroup');
            };
        }
    }, [socket, emailId]);

    useEffect( () => {     
        if(currEmailID){
            if(chats[currEmailID].type===undefined || chats[currEmailID]?.type!=='Group'){
                // socket.emit('status',{
                //     sender: currEmailID,
                //     receiver: emailId
                // });
                const userStatusUpadte = async (currEmailID) => {
                    try {
                        const response = await fetch(`${BackendUrl}/api/v1/checkUser`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ emailId: currEmailID }),
                        });
                        const data = await response.json();
                        
                        // update it
                        setChats((prevChats) => {
                            const updatedChats = { ...prevChats };
                            if(updatedChats[currEmailID]){
                                updatedChats[currEmailID].status=data.response.currStatus;
                                updatedChats[currEmailID].profilePhoto=data.response.profilePhoto;
                            }
                            return updatedChats;
                        })
                    } catch (error) {
                        console.log(error);
                    }
                }

                userStatusUpadte(currEmailID);
                
            }
            
        }
    }, [currEmailID])
    
    useEffect(() => {
        if (socket) {
            socket.on('updateMessage', (data) => {
                setChats((prevChats) => {
                    const messages = prevChats[data.sender]?.messages || [];
                    const messageIndex = messages.findIndex((message) => message.messageId === data.messageId);
                    
                    if (messageIndex !== -1) {
                        const updatedMessages = [...messages];
                        updatedMessages[messageIndex] = { ...updatedMessages[messageIndex], isSeen: true };
    
                        return {
                            ...prevChats,
                            [data.sender]: {
                                ...prevChats[data.sender],
                                messages: updatedMessages
                            }
                        };
                    }
                    return prevChats;
                });
            });
    
            return () => {
                socket.off('updateMessage');
            };
        }
    }, [socket,chats,currEmailID]);

    useEffect(() => {
      if(socket){
    
        localStorage.setItem(`${emailId}Rooms`, JSON.stringify(allRooms));

        // add user to all room in allRooms
        Object.entries(allRooms).map(([key,email])=>{
            const user = (emailId===email) ? 'me':'other';
            socket.emit('joinRoom', {emailId:email,user:user});
        })
      }   
    }, [socket,allRooms])
    
    if(mainPageLoad){
        return (
            <Box sx={{ display: 'flex' , justifyContent:'center', alignItems:'center'}} className='h-screen'>
                <CircularProgress />
            </Box>
        )
    }

return (
    <Container maxWidth="lg" className="h-screen flex flex-col p-4">

        <div className="flex h-full">

            {/* Left Side Chat List */}
            {(showChatList || !isSmallScreen) && (
                <div className="w-full min-w-[270px] sm:w-1/4 p-2 bg-white shadow rounded-lg sm:mr-4 min-h-fit">
                    <div className='flex justify-between items-center ml-2 mr-2'>
                        <Avatar src={myProfilePic.current} onClick={()=>{navigate(`/${emailId}/updateDetails`)}} className='cursor-pointer'/>

                        <div className='flex gap-4'>
                            {
                                backup ? (
                                    <Tooltip title="Backing up" placement="left">
                                        <PublishIcon className='cursor-pointer'/>
                                    </Tooltip>
                                ):(
                                 <Tooltip title="Back-Up Chats" placement="left">
                                    <BackupIcon className='cursor-pointer' onClick={backUpHandler}/>
                                </Tooltip>
                                )
                            }
                            

                            <Tooltip title="Log Out" placement="right">
                                <LogoutIcon className='cursor-pointer' onClick={logOutHandlerFunction}/>
                            </Tooltip>
                        </div>
                        
                    </div>
                    
                    <form className="flex mb-4 " onSubmit={startChatHandler}>
                        <TextField
                            id="standard-basic"
                            placeholder="Search New User"
                            margin='dense'
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchOutlinedIcon />
                                        </InputAdornment>
                                    ),
                                },
                                
                            }}
                            variant="outlined"
                            className="flex-grow"
                            type="email"
                            value={receiverEmailID}
                            onChange={roomChangeHandler}
                            
                        />
                    </form>
                    <div  className='flex justify-between pl-4 pr-4'>
                        <p className="mb-2 font-PlaywriteGBS font-semibold">Messages</p>
                        <Tooltip title="Create Group" placement="right">
                            <Button onClick={()=>{setopenGroupForm(true)}}> <GroupAddIcon/></Button>
                        </Tooltip>

                        <Dialog
                            open={openGroupForm}
                            onClose={handleCloseGroupForm}
                            PaperProps={{
                                component: 'form',
                                onSubmit: (event) => {
                                  event.preventDefault();
                                  handleCreateGroup();
                                }
                            }}
                        >
                            
                            <DialogTitle>Create New Group</DialogTitle>
                            <DialogContent>
                            {/* <DialogContentText>
                                *Press ENTER after group name input for verification
                            </DialogContentText> */}
                            
                            <TextField
                                autoFocus
                                required
                                margin="normal"
                                id="groupName"
                                name="groupName"
                                label="Group Name"
                                type="text"
                                fullWidth
                                variant="outlined"
                                value={groupFormData.groupName}
                                onChange={handleGroupNameChange}
                            />

                            <TextField
                                margin="normal"
                                id="email"
                                name="email"
                                label="Enter User Email"
                                type="email"
                                fullWidth
                                variant="outlined"
                                value={emailInput}
                                onChange={handleEmailInputChange}
                                // disabled={!isGroupNameVerified}
                                inputRef={emailInputRef}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddMember();
                                    }
                                }}
                            />

                            {error && <p style={{ color: 'red' }}>{error}</p>}
                            <List>
                                {groupFormData.members.map((email, index) => (
                                    <ListItem key={index}>
                                    <ListItemText primary={email} />
                                        <IconButton
                                        edge="end"
                                        aria-label="remove"
                                        onClick={() => handleRemoveMember(email)}
                                        >
                                        <CloseIcon />
                                        </IconButton>
                                    </ListItem>
                                ))}
                            </List>
                            </DialogContent>
                            <DialogActions>
                            <Button onClick={handleCloseGroupForm}>Cancel</Button>
                            
                            <Button type="submit" disabled={loading}>
                              {loading ? <CircularProgress size={24} color="inherit" /> : "Create Group"}
                            </Button>
                            </DialogActions>
                        </Dialog>

                    </div>   
                    
                    {chats &&
                        Object.entries(chats)
                            .sort(([, chatA], [, chatB]) => {
                            // Extract and parse the lastMessage time
                            const timeA = chatA.lastMessage?.time
                                ? Date.parse(chatA.lastMessage.time)
                                : 0;
                            const timeB = chatB.lastMessage?.time
                                ? Date.parse(chatB.lastMessage.time)
                                : 0;
                            return timeB - timeA; // Newer messages first
                            })
                            .map(([email, chat], index) => (
                            <div
                                key={index}
                                onClick={() => currentEmailHandler(email)}
                                className="font-mono cursor-pointer hover:bg-gray-100 p-2 rounded-lg transition duration-200 relative"
                            >
                                <div className="font-bold font-arima text-lg flex gap-2 items-center">
                                <Avatar src={chat?.profilePhoto} />
                                <p>{chat?.fullName}</p>
                                </div>

                                {chat.lastMessage && (
                                <p className="text-gray-600 font-arima pl-12">
                                    {chat.lastMessage?.message?.length > 10
                                    ? chat.lastMessage?.message.substring(0, 10) + "..."
                                    : chat.lastMessage?.message}{" "}
                                    - {chat.lastMessage?.time}
                                </p>
                                )}
                                {chat.unreadMessages > 0 && (
                                <div className="rounded-full bg-green-400 text-white z-10 absolute right-2 bottom-6 p-2 size-6 flex items-center justify-center">
                                    {chat.unreadMessages}
                                </div>
                                )}
                            </div>
                            ))}
                </div>
            )}

            {/* Right Side Chat Area */}
            {!showChatList || !isSmallScreen ? (
                <div className="w-full sm:w-3/4 p-2 bg-opacity-5 bg-cyan-200 shadow rounded-lg relative">
                         {profileDetails && (
                            <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-black bg-opacity-50 text-center">
                                <div className="p-4 bg-white rounded-lg shadow-lg text-center">
                                    <div className='flex justify-center items-center gap-5'>
                                        {
                                            loadDp &&
                                            <CircularProgress/>
                                        }
                                        <div className='flex items-center gap-2 justify-center'>
                                            <Avatar
                                                src={userDetails?.profilePic}
                                                sx={{ width: 80, height: 80 }}
                                                className="mx-auto mb-4 border-2 border-blue-500 cursor-pointer"
                                                onClick={() => setShowImageFullscreen(true)}
                                            />
                                            
                                            { chats[currEmailID].type==='Group' && userDetails?.adminSet.has(emailId) && 
                                                <h3 className='cursor-pointer' onClick={() => document.getElementById('imageUpload').click()} >Upload</h3>
                                            }

                                        </div>
                                        

                                        <input
                                            type="file"
                                            id="imageUpload"
                                            accept="image/*"
                                            style={{ display: 'none' }}
                                            onChange={handleImageChange}
                                        />
                                    </div>
                                    
                                    <Typography variant="h6">{userDetails?.fullName}</Typography>
                                    <Typography variant="body1" className='text-gray-500'>{userDetails?.userName}</Typography>
                                    <Typography variant="body2" color="textSecondary">{userDetails?.emailID}</Typography>
                                    {
                                        userDetails?.members &&
                                        <>  
                                            <Typography variant='h5'>Members</Typography>
                                            <ul>
                                                {Object.values(userDetails?.members).map((member, index) => (
                                                    <div className='flex justify-center items-center gap-2 mt-2'>
                                                        <li key={index}>{member}</li>
                                                    
                                                        { userDetails?.adminSet.has(member) &&
                                                        <div className='bg-green-200 text-green-500 p-1 rounded-md'>Admin</div>}
                                                    </div> 
                                                ))}
                                            </ul>
                                            {
                                                userDetails?.adminSet.has(emailId) && 
                                                <div className='flex flex-col justify-center items-center gap-2'>
                                                    <TextField id="standard-basic" label="User Email ID" variant="standard" onChange={newMemberChangeHandler} value={newMember} className='w-full' />
                                                    
                                                    <div className='gap-1 flex'>
                                                        <Button variant="contained" onClick={addMemberHandler}>Add</Button>
                                                        <Button variant='outlined' onClick={removeMemberHandler}>Remove</Button>
                                                        <Button variant='contained' onClick={makeAdminHandler} >Make Admin</Button>
                                                        <Button variant='outlined' onClick={removeAdminHandler} >Remove Admin</Button>
                                                    </div>

                                                    <div>
                                                        <Button variant='contained' color='warning' onClick={deleteGroupHandler}>Delete Group</Button>
                                                    </div>
    
                                                </div>
                                            }
                                            
                                        </>
                                    }
                                    {
                                        chats[currEmailID].type==='Group' && !userDetails?.adminSet.has(emailId) && 
                                        <Button variant='contained' color='warning' 
                                        onClick={leftGroupHandler} >Left Group</Button>
                                    }

                                    <button
                                        onClick={() => setprofileDetails(false)}
                                        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg block self-center w-full"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        )}

                        {showImageFullscreen && (
                            <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-80">
                                <img
                                    src={userDetails?.profilePic}
                                    alt="Profile Fullscreen"
                                    className="max-w-full max-h-full rounded-lg shadow-lg"
                                />
                                <button
                                    onClick={() => setShowImageFullscreen(false)}
                                    className="absolute top-5 right-5 text-white text-2xl bg-gray-800 rounded-full p-2"
                                >
                                    ✕
                                </button>
                            </div>
                        )}

                    {currEmailID && (
                        <div className="flex flex-col h-full">
                            {/* Chat header with Close Icon for small screens */}
                            <div className="flex items-center p-4 bg-gray-200 rounded-lg absolute top-0 w-full left-0">
                                {
                                    chats[currEmailID]?.type==='Group' ? (
                                        <Avatar src={chats[currEmailID]?.profilePhoto} onClick={()=>{handleFetchGroupInfo(currEmailID)}} className='cursor-pointer'/>
                                    ):(
                                        
                                            chats[currEmailID]?.status === 'online' ? (
                                                <StyledBadge
                                                    overlap="circular"
                                                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                                    variant="dot"
                                                    >
                                                        <Avatar src={chats[currEmailID]?.profilePhoto} onClick={()=>{handleFetchUserInfo(currEmailID)}} className='cursor-pointer'/>
                                                </StyledBadge>
                                            ):(
                                                <GreyStyledBadge
                                                overlap="circular"
                                                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                                variant="dot"
                                                >
                                                <Avatar src={chats[currEmailID]?.profilePhoto} onClick={()=>{handleFetchUserInfo(currEmailID)}} className='cursor-pointer'/>
                                                </GreyStyledBadge>
                                                
                                            )
                                        
                                    )
                                }
                                
                                <Typography variant="font-PTSans"  className="pl-5 text-xl antialiased font-bold">{chats[currEmailID]?.fullName}</Typography>
                                
                                {isSmallScreen && (
                                    <IconButton onClick={toggleChatList} className="ml-auto">
                                        <CloseIcon />
                                    </IconButton>
                                )}
                            </div>

                            {/* messages display */}
                            <div className="flex-1 overflow-y-auto p-4 mt-14 bg-sky-50 rounded-md">
                                {chats[currEmailID]?.messages.length > 0 ? (
                                    chats[currEmailID].messages.map((msg, index) => {
                                        const isUserMessage = msg.side === 'me';

                                        return (
                                            <Box key={index} className={`flex ${msg.type === 'AlertMessage' ? 'justify-center' : isUserMessage ? 'justify-end' : 'justify-start'} mb-2`}>
                                                <Box
                                                    className={`max-w-[70%] p-2 rounded-lg shadow-md ${isUserMessage ? 'bg-indigo-500 text-white' : 'bg-indigo-50 text-black'}`}
                                                >   
                                                    {
                                                        msg?.sender &&

                                                        <Typography variant="body1 font-AfacadFlux" className="break-words block">{msg.sender} ({msg.senderEmail})</Typography>
                                                    }
                                                    
                                                    {   (!msg.type||msg?.type!=='file') &&
                                                        <Typography variant="body1 font-AfacadFlux" className="break-words">{msg.message}</Typography>
                                                    }

                                                    {
                                                    msg.type === 'file' && typeof msg.message === 'string' && (
                                                        (() => {
                                                        const fileType = msg.message.split('.').pop().toLowerCase();

                                                        if (fileType === 'pdf') {
                                                            // Handle PDF files
                                                            return <PdfPreview pdfUrl={msg.message} />;
                                                        } else if (['mp3', 'wav', 'ogg'].includes(fileType)) {
                                                            // Handle Audio files
                                                            return (
                                                            <audio controls className="w-full max-w-sm rounded-md">
                                                                <source src={msg.message} type={`audio/${fileType}`} />
                                                                Your browser does not support the audio element.
                                                            </audio>
                                                            );
                                                        } else if (['mp4', 'webm', 'ogg'].includes(fileType)) {
                                                            // Handle Video files
                                                            return (
                                                            <video controls className="w-full max-w-sm rounded-md">
                                                                <source src={msg.message} type={`video/${fileType}`} />
                                                                Your browser does not support the video element.
                                                            </video>
                                                            );
                                                        } else {
                                                            // Handle Image files
                                                            return (
                                                            <img
                                                                onClick={() => toggleFullscreen(msg.message)}
                                                                src={msg.message}
                                                                alt="Uploaded file"
                                                                className="w-fit h-fit max-h-[200px] rounded-md cursor-pointer"
                                                            />
                                                            );
                                                        }
                                                        })()
                                                    )
                                                    }


                                                    {isFullscreen && (
                                                            <div
                                                            onClick={() => setIsFullscreen(false)} // Close modal when clicking outside
                                                            className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50"
                                                            >
                                                            <div className="relative w-full h-full max-w-4xl max-h-full">
                                                                <div className="absolute top-0 right-0 p-2 cursor-pointer">
                                                                <span
                                                                    className="text-white text-xl"
                                                                    onClick={() => setIsFullscreen(false)} // Close button
                                                                >
                                                                    X
                                                                </span>
                                                                </div>
                                                                <div className="w-full h-full">
                                                                <img
                                                                    src={fullscreenFileUrl}
                                                                    alt="Fullscreen view"
                                                                    className="w-full h-full object-contain"  // Ensure the image scales properly
                                                                />
                                                                </div>
                                                            </div>
                                                            </div>
                                                        )}

                                                    <Box className='flex gap-1'>
                                                        <Typography variant="caption font-AfacadFlux" className="text-gray-400 block text-right">
                                                            {msg.time}
                                                        </Typography>

                                                        { isUserMessage &&
                                                            <DoneAllOutlinedIcon 
                                                        sx={{
                                                            color: msg.isSeen ? '#7abcfa' :'#cdd1d4'
                                                        }}/>
                                                        }
                                                    </Box>
                                                   
                                                </Box>
                                            </Box>
                                        );
                                    })
                                ) : (
                                    <Typography variant="body2 font-AfacadFlux" className="text-gray-500 text-center mt-4 flex justify-center">No messages yet. Start the conversation!</Typography>
                                )}

                                {/* Ref to scroll to the bottom */}
                                <div ref={messagesEndRef} />

                            </div>

                            <form onSubmit={chats[currEmailID]?.type==='Group'? sendGroupMessage : sendHandler} className="flex p-2 relative border-2 rounded-md">

                                {/* Emoji Picker Trigger Icon */}
                                <button 
                                    type="button" 
                                    onClick={() => setIsEmojiPickerVisible(!isEmojiPickerVisible)} 
                                    className="ml-1 mr-2">
                                    😊 
                                </button>

                                {
                                    isUploading ? (
                                        <div
                                        className="flex items-center justify-center w-full p-2 text-sm text-gray-600 bg-gray-100 border border-gray-300 rounded-md"
                                    >
                                        Processing your file...
                                        </div>
                                    )
                                    :
                                    (
                                        <textarea
                                    placeholder="Your message"
                                    value={message}
                                    onChange={changeHandler}
                                    disabled={chats[currEmailID]?.type === 'Group' && !chats[currEmailID]?.in}
                                    rows={1}
                                    style={{
                                        width: '100%',
                                        resize: 'none',
                                        overflowY: 'hidden',
                                        padding: '10px',
                                        fontSize: '16px',
                                        lineHeight: '1.5',
                                        border: '1px solid #ccc',
                                        borderRadius: '8px',
                                        boxSizing: 'border-box',
                                        whiteSpace: 'pre-wrap',
                                        minHeight: '40px',
                                        maxHeight: '100px',
                                    }}
                                    onInput={(e) => {
                                    e.target.style.height = 'auto';
                                    e.target.style.height = `${e.target.scrollHeight}px`;
                                    }}
                                />
                                    )
                                }
                                

                                <input type='file' hidden id='file' onChange={ chats[currEmailID]?.type==='Group' ? groupFileUploadHandler : fileUploadHandler }></input>
                                <div
                                    className="cursor-pointer mt-2 text-gray-500 mr-2"
                                    onClick={() => document.getElementById('file').click()}
                                >
                                    <AttachFileOutlinedIcon className="text-xl" />
                                </div>
                                
                                {/* Conditionally render the Emoji Picker */}
                                {isEmojiPickerVisible && (
                                    <div className="absolute bottom-12 left-0 z-10">
                                        <EmojiPicker onEmojiClick={onEmojiClick} />
                                    </div>
                                )}
                                <button>
                                    <SendRoundedIcon  sx={{ color: 'primary.main' }} type="submit" className='-rotate-45 ml-2 '/>
                                </button>
                                
                            </form>
                        </div>
                    )}
                </div>
            ) : (null)}

        </div>
    </Container>
);
};

export default ChatPage;