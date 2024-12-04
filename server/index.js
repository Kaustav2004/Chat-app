import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import cors from 'cors';
import dbConnect from './Config/Database.js';
import authRoutes from './Routes/authRoutes.js';
import chatRoutes from './Routes/chatRoutes.js';
import dotenv from 'dotenv';

dotenv.config();

const BACKEND_URL = process.env.BACKEND_URL;
const BASE_URL =  process.env.BASE_URL;
const app = express();

// Create server

const allowedOrigins = [
  'https://chat-q9cpep8if-kaustavs-projects-890192ff.vercel.app'
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
};

// Express CORS
app.use(cors(corsOptions));


const server = createServer(app);
// Socket.IO CORS
const io = new Server(server, {
  cors: corsOptions,
});


// const io = new Server(server, {
//   cors: {
//     origin: `${BASE_URL}`,
//     methods: ['GET', 'POST'],
//     credentials: true,
//   },
// });

// Middlewares

app.use('/uploads', express.static('uploads'));

app.use(express.json());

// app.use(cors({
//   origin: '*',
//   methods: ['GET', 'POST', 'PUT', 'DELETE'],
//   credentials: true,
// }));
// app.use(cors());

// Default route
app.get('/', (req, res) => {
  res.send(`Home Backend`);
});

// Use the routes
app.use("/api/v1", authRoutes);
app.use("/api/v1", chatRoutes);

// Handle socket connection
io.on('connection', (socket) => {
  console.log('a user connected:', socket.id);
  
  // Handle user joining a personal room based on emailId
  socket.on('joinRoom', async ({emailId,user}) => {
    socket.join(emailId);
    socket.emailId = emailId;
    console.log(`User with socket ID ${socket.id} joined room: ${emailId}`);

    if(user==='me'){
      // Emit the 'online' event to all clients or specific ones as needed
      io.emit("currStatus", { userId: emailId, status: "online" }); 

      // upadte on db
      try {
        const response = await fetch(`${BACKEND_URL}/api/v1/updateStatus`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ socketId: socket.id, status:"online" })
        });

        const data = await response.json();
        if(!data.success){
          console.log(data.message);
        }
      } catch (error) {
        console.log(error);
      }

      // socket id in db
      try {
        const response = await fetch(`${BACKEND_URL}/api/v1/updateSocket`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emailId: emailId, socketId: socket.id })
        });

        const data = await response.json();
        if(!data.success){
          console.log(data.message);
        }
        
      } catch (error) {
        console.log(error);
      }
    }


  });

  // for group notification--send from the group creator
  socket.on('notify',({emailId,groupName,groupId})=>{
    io.to(emailId).emit('addGroup', { groupName,groupId });
  })

  // Handling chat messages within the group
  socket.on('sendGroupMessage', ({ messageId, groupName, message, sender, time, fullName, type }) => {

    // Broadcast the message to all users in the group room
    socket.broadcast.to(groupName).emit('receiveGroupMessage', {
      messageId,
      sender,
      message,
      groupName,
      time,
      fullName,
      type
    });

  });

  // remove user from group
  socket.on('disableUser',({groupName, user}) => {
    io.to(user).emit('disableGroup',{groupName});
  })
  
  // Send message to another user by their room (email)
  socket.on('sendMessage', ({ messageId, sender, receiver, message, time, type, fullName,isSeen }) => {
    console.log(`${sender} sends message to ${receiver}: ${message}`);
    io.to(receiver).emit('receiveMessage', { messageId, sender, message, time, type, fullName, isSeen});
  });

  // update seen message
  socket.on('seenUpdate',({messageId, receiver, sender}) => {
    io.to(receiver).emit('updateMessage', {messageId, sender});
  })


  // user
  // Handle disconnection
  socket.on('disconnect', async () => {
    console.log('User disconnected:', socket.id);

    // upadte on db
    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/updateStatus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ socketId: socket.id, status:"offline" })
      });

      const data = await response.json();

      if(!data.success){
        console.log(data.message);
      }
      else{
        const emailId = data.response.emailId;
        try {
          const response = await fetch(`${BACKEND_URL}/api/v1/updateSocket`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({emailId:emailId, socketId:'None'})
          });
    
          const data = await response.json();
          if(!data.success){
            console.log(data.message);
          }
          else{
            // socket emit that ensure that user is offline
            io.emit("currStatus", { userId: emailId, status: "offline" }); 
          }
          
        } catch (error) {
          console.log(error);
        }
        
      }
    } catch (error) {
      console.log(error);
    }
  });
});

// dbConnect
dbConnect();

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
