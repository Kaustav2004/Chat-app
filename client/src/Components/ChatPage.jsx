import React, { useEffect, useState,useRef } from 'react';
import { io } from 'socket.io-client';
import { Avatar, Box, Button, Container, TextField, Typography, IconButton,InputAdornment,Tooltip } from '@mui/material';
import toast from 'react-hot-toast';
import { useParams } from 'react-router-dom';
import CloseIcon from '@mui/icons-material/Close';
import { useMediaQuery } from '@mui/material';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import GroupAddIcon from '@mui/icons-material/GroupAdd';

const ChatPage = () => {
    let myFullName = useRef('');
    const { emailId } = useParams();
    const [socket, setSocket] = useState(null);
    const [receiverEmailID, setReceiverEmailID] = useState('');
    const [message, setMessage] = useState('');
    const [chats, setChats] = useState({});
    const [currEmailID, setCurrEmailID] = useState();
    const [lastDpUpadte, setlastDpUpadte] = useState(0);
    const [showChatList, setShowChatList] = useState(true);
    const isSmallScreen = useMediaQuery('(max-width: 600px)'); // Detect small screens

    useEffect(  () => {
        const newSocket = io('http://localhost:3000');
        
        const fetchFullName = async ()=>{
            try {
                const response = await fetch('http://localhost:3000/api/v1/checkUser', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ emailId: emailId })
                });
    
                const data = await response.json();

                myFullName.current=data.response.fullName;
    
            } catch (error) {
                console.log(error);
            }
        }

        fetchFullName();

        newSocket.on('connect', () => {
            console.log('Connected to the server with id:', newSocket.id);
        });

        newSocket.on('disconnect', () => {
            console.log('Disconnected from the server');
        });

        newSocket.on('connect_error', (err) => {
            console.error('Connection Error:', err);
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, []);

    const sendHandler = (e) => {
        e.preventDefault();

        if (message !== '' && currEmailID) {
            const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

            socket.emit('sendMessage', {
                sender: emailId,
                receiver: currEmailID,
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
                            updatedChats[receiverEmailID] = { messages: [], lastMessage: {}, fullName: data.response.fullName,profilePhoto:data.response.profilePhoto };
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

    const currentEmailHandler = (email, userName) => {
        setCurrEmailID(email);

        if (isSmallScreen) {
            setShowChatList(false);  // Hide chat list on small screens when a chat is selected
        }
    };

    useEffect(() => {
      console.log(chats);
    }, [chats])
    
    const toggleChatList = () => {
        setShowChatList(true);
    };

    useEffect(() => {
        if (socket) {
            socket.on('receiveMessage', (data) => {
                console.log(data);
                setChats((prevChats) => {
                    const updatedChats = { ...prevChats };
                    if (!updatedChats[data.sender]) {
                        updatedChats[data.sender] = { messages: [], lastMessage: {},profilePhoto:''};
                    }

                    updatedChats[data.sender].fullName = data.fullName;

                    updatedChats[data.sender].messages.push({
                        message: data.message,
                        time: data.time
                    });

                    updatedChats[data.sender].lastMessage = {
                        message: data.message,
                        time: data.time
                    };

                    return updatedChats;
                });
                getUserInfo(data.sender);
            });

            if (emailId) {
                socket.emit('joinRoom', emailId);
            }

            return () => {
                socket.off('receiveMessage');
            };
        }
    }, [socket, emailId]);

return (
    <Container maxWidth="lg" className="h-screen flex flex-col p-4">
        <div className="flex h-full">
            {/* Left Side Chat List */}
            {(showChatList || !isSmallScreen) && (
                <div className="w-full min-w-[270px] sm:w-1/4 p-2 bg-white shadow rounded-lg sm:mr-4">
                    <form className="flex mb-4 " onSubmit={startChatHandler}>
                        <TextField
                            id="standard-basic"
                            placeholder="Search"
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
                            <Button> <GroupAddIcon/></Button>
                        </Tooltip>
                    </div>   
                    

                    {Object.keys(chats).map((email, index) => (
                        <div
                        key={index}
                        onClick={() => currentEmailHandler(email, chats[email].fullName)}
                        className="font-mono cursor-pointer hover:bg-gray-100 p-2 rounded-lg transition duration-200"
                      >

                        <div className="font-bold font-arima text-lg flex gap-2 items-center">
                            <Avatar src={chats[email]?.profilePhoto} />
                            <p>{chats[email]?.fullName}</p>
                        </div>
                      
                        {chats[email].lastMessage && (
                          <p className="text-gray-600 font-arima pl-12">
                            {chats[email].lastMessage.message} - {chats[email].lastMessage.time}
                          </p>
                        )}
                      </div>                      
                    ))}
                </div>
            )}

            {/* Right Side Chat Area */}
            {!showChatList || !isSmallScreen ? (
                <div className="w-full sm:w-3/4 p-2 bg-opacity-5 bg-cyan-200 shadow rounded-lg relative">
                    {currEmailID && (
                        <div className="flex flex-col h-full">
                            {/* Chat header with Close Icon for small screens */}
                            <div className="flex items-center p-4 bg-gray-200 rounded-lg absolute top-0 w-full left-0">
                                <Avatar src={chats[currEmailID]?.profilePhoto} />
                                <Typography variant="font-PTSans"  className="pl-5 text-xl antialiased font-bold">{chats[currEmailID]?.fullName}</Typography>
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
                                                    <Typography variant="body1 font-AfacadFlux" className="break-words">{msg.message}</Typography>
                                                    <Typography variant="caption font-AfacadFlux" className="text-gray-400 block text-right">{msg.time}</Typography>
                                                </Box>
                                            </Box>
                                        );
                                    })
                                ) : (
                                    <Typography variant="body2 font-AfacadFlux" className="text-gray-500 text-center mt-4 flex justify-center">No messages yet. Start the conversation!</Typography>
                                )}
                            </div>

                            <form onSubmit={sendHandler} className="flex p-2">
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