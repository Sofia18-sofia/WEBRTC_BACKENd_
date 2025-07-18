const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
PORT = process.env.PORT || 5000;

const app = express();

// ✅ Allow only your frontend domain here
const FRONTEND_URL = "https://super-smakager-c8ae31.netlify.app";

app.use(cors({
  origin: FRONTEND_URL,
  methods: ['GET', 'POST'],
  credentials: true
}));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Rest of your code remains same
const rooms = {};
io.on('connection', (socket) => {
  console.log('a user connected:', socket.id);

  socket.on('join', (roomId, callback) => {
    if (!rooms[roomId]) {
      rooms[roomId] = [];
    }

    const users = rooms[roomId];
    if (users.length >= 2) {
      return callback({ success: false, message: 'Room full or invalid' });
    }

    rooms[roomId].push(socket.id);
    socket.join(roomId);

    const otherUser = users.find(id => id !== socket.id);
    if (otherUser) {
      socket.to(otherUser).emit('ready', socket.id);
    }

    callback({ success: true });
  });

  socket.on('signal', ({ targetId, signal }) => {
    io.to(targetId).emit('signal', { callerId: socket.id, signal });
  });

  socket.on('disconnecting', () => {
    for (const roomId of socket.rooms) {
      const users = rooms[roomId] || [];
      rooms[roomId] = users.filter(id => id !== socket.id);
      socket.to(roomId).emit('user-left', socket.id);
    }
  });

  socket.on('disconnect', () => {
    console.log('user disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000; // ✅ Use this for Render
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
