const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

const rooms = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    
    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        strokes: [],
        users: new Set()
      });
    }
    
    const room = rooms.get(roomId);
    room.users.add(socket.id);
    
    socket.emit('room-state', room.strokes);
    socket.to(roomId).emit('user-joined', socket.id);
    
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  socket.on('draw-stroke', (data) => {
    const { roomId, stroke } = data;
    
    if (rooms.has(roomId)) {
      const room = rooms.get(roomId);
      room.strokes.push(stroke);
      
      socket.to(roomId).emit('new-stroke', stroke);
    }
  });

  socket.on('clear-board', (roomId) => {
    if (rooms.has(roomId)) {
      const room = rooms.get(roomId);
      room.strokes = [];
      
      io.to(roomId).emit('board-cleared');
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    rooms.forEach((room, roomId) => {
      if (room.users.has(socket.id)) {
        room.users.delete(socket.id);
        socket.to(roomId).emit('user-left', socket.id);
        
        if (room.users.size === 0) {
          setTimeout(() => {
            if (rooms.has(roomId) && rooms.get(roomId).users.size === 0) {
              rooms.delete(roomId);
              console.log(`Room ${roomId} cleaned up`);
            }
          }, 60000);
        }
      }
    });
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});