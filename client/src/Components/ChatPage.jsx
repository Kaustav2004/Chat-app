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
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import CheckCircleIcon from '@mui/icons-material/CheckCircle'; 
import DoneAllOutlinedIcon from '@mui/icons-material/DoneAllOutlined';
import { styled } from '@mui/material/styles';
import Badge from '@mui/material/Badge';

const ChatPage = () => {
    const { emailId } = useParams();
    const navigate = useNavigate();
    const messagesEndRef = useRef(null);
    const localStorageChats = JSON.parse(localStorage.getItem(emailId));
    const myFullName = useRef('');
    const myProfilePic = useRef('');
    const sentMessageIds = useRef(new Set());
    const [socket, setSocket] = useState(null);
    const [receiverEmailID, setReceiverEmailID] = useState('');
    const [message, setMessage] = useState('');
    const [chats, setChats] = useState(localStorageChats);
    const [currEmailID, setCurrEmailID] = useState();
    const [mainPageLoad, setmainPageLoad] = useState(false);
    const [openGroupForm, setopenGroupForm] = useState(false);
    const [showChatList, setShowChatList] = useState(true);
    const [groupFormData, setGroupFormData] = useState({
        groupName: '',
        members: [emailId]
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [emailInput, setEmailInput] = useState('');
    const [allRooms, setallRooms] = useState([emailId]);
    const [profileDetails, setprofileDetails] = useState(false);
    const [profileSkeleton, setprofileSkeleton] = useState(false);
    const [userDetails, setuserDetails] = useState('');
    // const [isGroupNameVerified, setIsGroupNameVerified] = useState(false);
    const isSmallScreen = useMediaQuery('(max-width: 600px)');
    const emailInputRef = useRef(null);
    const [showImageFullscreen, setShowImageFullscreen] = useState(false);

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
        setmainPageLoad(true);
        const newSocket = io('http://localhost:3000');
    
        const fetchUserInfo = async () => {
            try {
                const response = await fetch('http://localhost:3000/api/v1/checkUser', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ emailId: emailId }),
                });
                const data = await response.json();
                console.log(data);
    
                // Update profile info
                myFullName.current = data.response.fullName;
                myProfilePic.current = data.response.profilePhoto;

                // Store rooms from local storage
                const roomsFromStorage = JSON.parse(localStorage.getItem(`${emailId}Rooms`));
                console.log(roomsFromStorage);
                if (roomsFromStorage.length>1) {
                    setallRooms(roomsFromStorage);
                }
                else{
                    // fetch from db for groups
                    const groups = data.response.groups;
                    console.log(groups);
                    groups.forEach(group => {
                        setallRooms(prevRooms => {
                            const updatedRooms = {...prevRooms};
                            // Get the next index (numeric key)
                            const nextIndex = Object.keys(updatedRooms).length;
            
                            // Add the new email/groupName at the next index
                            updatedRooms[nextIndex] = group._id;

                            return updatedRooms;
                        })
                        setChats((prevChats) => {
                            // later dp will fetched from db
                            const updatedChats = { ...prevChats };
                            if (!updatedChats[group._id]) {
                                updatedChats[group._id] = {type:'Group',messages: [], lastMessage: {}, fullName:group.groupName,groupId:group._id,profilePhoto:group.groupProfilePic,unreadMessages:0,
                                members:group.members };
                            }
                            return updatedChats;
                        });
                    });
                }
                
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
                            const response = await fetch('http://localhost:3000/api/v1/fetchStatus', {
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
    
        fetchUserInfo();
    
        // Socket event handlers
        newSocket.on('connect', () => {
            console.log('Connected to the server with id:', newSocket.id);
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
    

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const sendHandler = (e) => {
        e.preventDefault();
        const messageId = Date.now();
        const timestamp = Date().split("GMT")[0].trim();

        if (!sentMessageIds.current.has(messageId)) {
            // Add the message ID to the Set
            sentMessageIds.current.add(messageId);

            socket.emit('sendMessage', {
                messageId: messageId,
                sender: emailId,
                receiver: currEmailID,
                message: message,
                time: timestamp,
                fullName: myFullName.current,
                isSeen: false
            });

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

    const sendGroupMessage = (e) => {
        e.preventDefault();

        if (message !== '' && currEmailID) {
            const timestamp = Date().split("GMT")[0].trim();

            socket.emit('sendGroupMessage', {
                groupName:currEmailID,
                sender: emailId,
                message: message,
                time: timestamp,
                fullName:myFullName.current
            });

            setChats((prevChats) => {
                const updatedChats = { ...prevChats };
                if (!updatedChats[currEmailID]) {
                    updatedChats[currEmailID] = { messages: [], lastMessage: {} };
                }

                updatedChats[currEmailID].messages.push({
                    side: 'me',
                    message: message,
                    time: timestamp
                });

                updatedChats[currEmailID].lastMessage = {
                    side: 'me',
                    message: message,
                    time: timestamp
                };

                setMessage('');
                return updatedChats;
            });
        }
    };

    const changeHandler = (e) => {
        const tempMessage=e.target.value;
        tempMessage.trim();
        setMessage(tempMessage);
    };

    const roomChangeHandler = (e) => {
        setReceiverEmailID(e.target.value);
    };

    const getUserInfo = async (email)=> {

        try {
            const response = await fetch('http://localhost:3000/api/v1/checkUser', {
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
                const response = await fetch('http://localhost:3000/api/v1/checkUser', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ emailId: receiverEmailID })
                });

                const data = await response.json();
                console.log(data);
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

    // auto scroll handle
    // useEffect(() => {
    //     scrollToBottom();
    // }, [ chats[currEmailID]?.messages]);

    useEffect(() => {
      console.log(chats);
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
    
    useEffect(() => {
        if (currEmailID && chats[currEmailID]) {
            if(chats[currEmailID]?.type === 'Group' && chats[currEmailID]?.unreadMessages>0){
                setChats( prevChats => {
                    const updatedMessages = [...prevChats[currEmailID].messages];
                    return {
                        ...prevChats,
                        [currEmailID]: {
                            ...prevChats[currEmailID],
                            unreadMessages:0,
                            messages: updatedMessages
                        }
                    };
                })
            }
            else{
                const allMessages = chats[currEmailID].messages || [];

            // Filter only received messages that are unread (to avoid marking sent messages as seen)
            const unreadMessages = allMessages.filter(
                message => message.isSeen === false && message.side !== 'me' // Ensure only received messages
            );
            let numOfUnreadMessage=chats[currEmailID].unreadMessages-unreadMessages.length;
            if(numOfUnreadMessage<0) numOfUnreadMessage=0;
            if (unreadMessages.length > 0) {
                unreadMessages.forEach(message => {
                    const messageId = message.messageId;
    
                    // Emit seen update only for the unread received messages
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
    
                        return {
                            ...prevChats,
                            [currEmailID]: {
                                ...prevChats[currEmailID],
                                unreadMessages:numOfUnreadMessage,
                                messages: updatedMessages
                            }
                        };
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
                const response = await fetch('http://localhost:3000/api/v1/checkUser', {
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
            console.log('Group Data:', groupFormData);

            // join all members in same group 
            const groupName = groupFormData.groupName.trim();
            const members = groupFormData.members;

            // db call for store group data
            try {
                const response = await fetch('http://localhost:3000/api/v1/createGroup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(
                        { 
                            groupName: groupName,
                            members:members,
                            groupProfilePic:`https://api.dicebear.com/9.x/initials/svg?seed=${groupName}`
                        })
                });
            
                const result = await response.json();
                console.log(result);
                if(result.success){
                    setChats((prevChats) => {
                        const updatedChats = { ...prevChats };
                        if (!updatedChats[result.group._id]) {
                            updatedChats[result.group._id] = {type:'Group',messages: [], lastMessage: {}, fullName:result.group.groupName,profilePhoto:result.group.
                            groupProfilePic,groupId:result.group._id,
                            members:result.group.members,
                            unreadMessages:0 };
                        }
                        return updatedChats;
                    });
        
                    setallRooms((prevRooms) => {
                        const updatedRooms = { ...prevRooms };
                        console.log(updatedRooms);
        
                        // Get the next index (numeric key)
                        const nextIndex = Object.keys(updatedRooms).length;
        
                        // Add the new email/groupName at the next index
                        updatedRooms[nextIndex] = result.group._id;
        
                        return updatedRooms;
                    });

                    Object.entries(members).map(([key,emailid])=>{
                        if(emailid!==emailId){
                            console.log(emailid);
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
            // setIsGroupNameVerified(false);
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
            const response = await fetch('http://localhost:3000/api/v1/checkUser', {
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

            console.log(data);
        } catch (error) {
            toast.error(`${error}`);
        }

        setprofileSkeleton(false);
    }

    const handleFetchGroupInfo = async (groupId) =>{
        setprofileSkeleton(true);

        try {
            const response = await fetch('http://localhost:3000/api/v1/fetchGroupInfo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: groupId })
            });

            const data = await response.json();

            if(data.success){
                setuserDetails({
                    fullName:data.response.groupName,
                    profilePic:data.response.groupProfilePic,
                    members:data.response.members,
                    created:data.response.createdAt,
                    updated:data.response.updatedAt
                })
                setprofileDetails(true);
            }
            else{
                toast.error(`${data.message}`);
            }

            console.log(data);
        } catch (error) {
            toast.error(`${error}`);
        }

        setprofileSkeleton(false);
    }

    useEffect(() => {
        if (socket) {
            socket.on('receiveMessage', (data) => {
                console.log(data);
                setChats((prevChats) => {
                    const updatedChats = { ...prevChats };
                    if (!updatedChats[data.sender]) {
                        updatedChats[data.sender] = { messages: [], lastMessage: {},profilePhoto:'',unreadMessages:0};
                    }

                    updatedChats[data.sender].fullName = data.fullName;
                    // console.log(updatedChats[data.seder]);
                    const numOfUnreadMessage=updatedChats[data.sender].unreadMessages+1;
                    updatedChats[data.sender].unreadMessages=numOfUnreadMessage;
                    updatedChats[data.sender].messages.push({
                        messageId: data.messageId,
                        message: data.message,
                        time: data.time,
                        isSeen: data.isSeen
                    });

                    updatedChats[data.sender].lastMessage = {
                        message: data.message,
                        time: data.time
                    };

                    return updatedChats;
                });
                getUserInfo(data.sender);
            });

            socket.on('addGroup',(data)=>{
                console.log(data);
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
                        members:'' };
                    }
                    return updatedChats;
                });

            })

            socket.on('receiveGroupMessage',(data) => {
                console.log(data);

                setChats((prevChats) => {
                    const updatedChats = { ...prevChats };
                    const numOfUnreadMessage=updatedChats[data.groupName].unreadMessages+1;
                    updatedChats[data.groupName].unreadMessages=numOfUnreadMessage;
                    updatedChats[data.groupName].messages.push({
                        sender:data.fullName,
                        message: data.message,
                        time: data.time
                    });

                    updatedChats[data.groupName].lastMessage = {
                        message: data.message,
                        time: data.time
                    };

                    return updatedChats;
                });

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

            return () => {
                socket.off('receiveMessage');
                socket.off('addGroup');
                socket.off('receiveGroupMessage');
                socket.off('currStatus');
            };
        }
    }, [socket, emailId]);

    useEffect(() => {
        if(emailId && currEmailID){
            console.log("emit for checking status")
            socket.emit('status',{
                sender: currEmailID,
                receiver: emailId
            });
        }
    }, [currEmailID,emailId])
    
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
        Object.entries(allRooms).map(([key,emailId])=>{

            socket.emit('joinRoom', emailId);
        })
      }   
    }, [socket,allRooms])
    

    if(mainPageLoad){
        return (
            <Box sx={{ display: 'flex' , justifyContent:'center', alignItems:'center'}} className='h-screen'>
                <CircularProgress />
            </Box>
      )}

return (
    <Container maxWidth="lg" className="h-screen flex flex-col p-4">

        <div className="flex h-full">

            {/* Left Side Chat List */}
            {(showChatList || !isSmallScreen) && (
                <div className="w-full min-w-[270px] sm:w-1/4 p-2 bg-white shadow rounded-lg sm:mr-4 min-h-fit">
                    <Avatar src={myProfilePic.current} onClick={()=>{navigate(`/${emailId}/updateDetails`)}} className='cursor-pointer'/>
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
                    Object.keys(chats).map((email, index) => (
                        <div
                        key={index}
                        onClick={() => currentEmailHandler(email)}
                        className="font-mono cursor-pointer hover:bg-gray-100 p-2 rounded-lg transition duration-200 relative"
                      >

                        <div className="font-bold font-arima text-lg flex gap-2 items-center">
                            <Avatar src={chats[email]?.profilePhoto} />
                            <p>{chats[email]?.fullName}</p>
                        </div>
                      
                        {chats[email].lastMessage && (
                          <p className="text-gray-600 font-arima pl-12">
                            {chats[email]?.lastMessage?.message?.length > 10 
                            ? chats[email]?.lastMessage?.message.substring(0, 10) + '...' 
                            : chats[email]?.lastMessage?.message} - {chats[email]?.lastMessage?.time}
                          </p>
                        )}
                        { chats[email].unreadMessages>0 &&
                            <div className='rounded-full bg-green-400 text-white z-10 absolute right-2 bottom-6 p-2 size-6 flex items-center justify-center'>{chats[email].unreadMessages}</div>
                        }
                      </div>                      
                    ))}
                </div>
            )}

            {/* Right Side Chat Area */}
            {!showChatList || !isSmallScreen ? (
                <div className="w-full sm:w-3/4 p-2 bg-opacity-5 bg-cyan-200 shadow rounded-lg relative">
                         {profileDetails && (
                            <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-black bg-opacity-50">
                                <div className="p-4 bg-white rounded-lg shadow-lg text-center">
                                    <Avatar
                                        src={userDetails?.profilePic}
                                        sx={{ width: 80, height: 80 }}
                                        className="mx-auto mb-4 border-2 border-blue-500 cursor-pointer"
                                        onClick={() => setShowImageFullscreen(true)}
                                    />
                                    <Typography variant="h6">{userDetails?.fullName}</Typography>
                                    <Typography variant="body1" className='text-gray-500'>{userDetails?.userName}</Typography>
                                    <Typography variant="body2" color="textSecondary">{userDetails?.emailID}</Typography>
                                    {
                                        userDetails?.members &&
                                        <>  
                                            <Typography variant='h5'>Members</Typography>
                                            <ul>
                                                {Object.values(userDetails?.members).map((member, index) => (
                                                    <li key={index}>{member}</li>
                                                ))}
                                            </ul>
                                        </>
                                    }
                                    
                                    <button
                                        onClick={() => setprofileDetails(false)}
                                        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg"
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
                                {
                                    chats[currEmailID]?.members &&

                                    <Typography variant="font-PTSans"  className="pl-5 text-sm antialiased font-bold">{chats[currEmailID]?.members?.length} members</Typography>
                                }
                                
                                {isSmallScreen && (
                                    <IconButton onClick={toggleChatList} className="ml-auto">
                                        <CloseIcon />
                                    </IconButton>
                                )}
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 mt-14 bg-sky-50 rounded-md">
                                {chats[currEmailID]?.messages.length > 0 ? (
                                    chats[currEmailID].messages.map((msg, index) => {
                                        const isUserMessage = msg.side === 'me';

                                        return (
                                            <Box key={index} className={`flex ${isUserMessage ? 'justify-end' : 'justify-start'} mb-2`}>
                                                <Box
                                                    className={`max-w-[70%] p-2 rounded-lg shadow-md ${isUserMessage ? 'bg-indigo-500 text-white' : 'bg-indigo-50 text-black'}`}
                                                >   
                                                    {
                                                        msg?.sender &&

                                                        <Typography variant="body1 font-AfacadFlux" className="break-words block">{msg.sender}</Typography>
                                                    }
                                                    
                                                    <Typography variant="body1 font-AfacadFlux" className="break-words">{msg.message}</Typography>

                                                    <Box className='flex gap-1'>
                                                        <Typography variant="caption font-AfacadFlux" className="text-gray-400 block text-right">
                                                            {msg.time}
                                                        </Typography>

                                                        { isUserMessage &&
                                                            <DoneAllOutlinedIcon 
                                                        sx={{
                                                            // #3a70f0 797785
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
                                {/* <div ref={messagesEndRef} /> */}
                            </div>

                            <form onSubmit={chats[currEmailID]?.type==='Group'? sendGroupMessage : sendHandler} className="flex p-2">
                                <TextField
                                    id="standard-basic"
                                    placeholder='Your message'
                                    variant="standard"
                                    className="flex-grow "
                                    value={message}
                                    onChange={changeHandler}
                                />
                                <button>
                                    <SendRoundedIcon  sx={{ color: 'primary.main' }} type="submit" className='-rotate-45 '/>
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