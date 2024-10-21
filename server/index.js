import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import cors from 'cors';
import dbConnect from './Config/Database.js';
import authRoutes from './Routes/authRoutes.js';
import chatRoutes from './Routes/chatRoutes.js';

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
app.use(express.json());
app.use(cors());


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
    console.log(`User with socket ID ${socket.id} joined room: ${emailId}`);
  });


  // Send message to another user by their room (email)
  socket.on('sendMessage', ({ sender, receiver, message, time, fullName }) => {
    console.log(`${sender} sends message to ${receiver}: ${message}`);
    io.to(receiver).emit('receiveMessage', { sender, message, time, fullName });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// dbConnect
dbConnect();
// Start the server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
