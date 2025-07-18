// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const rooms = {}; // track socket ids by roomId

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

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
