import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import cors from 'cors';
import dbConnect from './Config/Database.js';
import authRoutes from './Routes/authRoutes.js';
import chatRoutes from './Routes/chatRoutes.js';
import bodyParser from 'body-parser';

const app = express();

// Create server
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middlewares

app.use('/uploads', express.static('uploads'));

app.use(express.json());

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));
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
  socket.on('joinRoom', (emailId) => {
    socket.join(emailId);
    socket.emailId = emailId;
    console.log(`User with socket ID ${socket.id} joined room: ${emailId}`);

    // Emit the 'online' event to all clients or specific ones as needed
    io.emit("currStatus", { userId: emailId, status: "online" }); 
  });

  // for group notification--send from the group creator
  socket.on('notify',({emailId,groupName,groupId})=>{
    io.to(emailId).emit('addGroup', { groupName,groupId });
  })

  // Handling chat messages within the group
  socket.on('sendGroupMessage', ({ groupName, message, sender, time, fullName }) => {

    // Broadcast the message to all users in the group room
    socket.broadcast.to(groupName).emit('receiveGroupMessage', {
      sender,
      message,
      groupName,
      time,
      fullName
    });

  });

  // Send message to another user by their room (email)
  socket.on('sendMessage', ({ messageId, sender, receiver, message, time, fullName,isSeen }) => {
    console.log(`${sender} sends message to ${receiver}: ${message}`);
    io.to(receiver).emit('receiveMessage', { messageId, sender, message, time, fullName, isSeen});
  });

  // update seen message
  socket.on('seenUpdate',({messageId, receiver, sender}) => {
    io.to(receiver).emit('updateMessage', {messageId, sender});
  })


  // user
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);

    console.log(socket.emailId);
    // socket emit that ensure that user is offline
    io.emit("currStatus", { userId: socket.emailId, status: "offline" }); 
  });
});

// dbConnect
dbConnect();
// Start the server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
