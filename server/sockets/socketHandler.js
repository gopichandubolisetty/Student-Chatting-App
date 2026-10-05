const Message = require('../models/Message');
const Room = require('../models/Room');
const jwt = require('jsonwebtoken');

// In-memory map: roomId → Set of socket IDs (for participant count)
const roomParticipants = new Map();

const socketHandler = (io) => {
  // ─── Authentication middleware for Socket.io ─────────────────────────────

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.cookie
      ?.split(';')
      .find((c) => c.trim().startsWith('token='))
      ?.split('=')[1];

    if (!token) {
      return next(new Error('Authentication error: No token provided.'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token.'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id} (${socket.user?.email})`);

    // ─── joinRoom ────────────────────────────────────────────────────────────
    socket.on('joinRoom', async ({ roomId }) => {
      try {
        // Leave any previous rooms first
        socket.rooms.forEach((room) => {
          if (room !== socket.id) {
            socket.leave(room);
            removeParticipant(room, socket.id);
            io.to(room).emit('participantCount', getParticipantCount(room));
          }
        });

        socket.join(roomId);
        socket.currentRoom = roomId;

        // Track participant (skip admins from public count)
        if (socket.user?.role === 'student') {
          addParticipant(roomId, socket.id);
        }

        io.to(roomId).emit('participantCount', getParticipantCount(roomId));
        console.log(`👥 ${socket.user?.email} joined room: ${roomId}`);
      } catch (err) {
        socket.emit('error', { message: 'Failed to join room.' });
      }
    });

    // ─── adminJoinRoom (silent observer) ─────────────────────────────────────
    socket.on('adminJoinRoom', ({ roomId }) => {
      if (socket.user?.role !== 'admin') {
        return socket.emit('error', { message: 'Unauthorized.' });
      }
      socket.join(roomId);
      socket.currentRoom = roomId;
      // Admin does NOT get added to participant count
      console.log(`🔍 Admin ${socket.user?.email} silently joined room: ${roomId}`);
    });

    // ─── sendMessage ──────────────────────────────────────────────────────────
    socket.on('sendMessage', async ({ roomId, text, imageUrl }) => {
      try {
        if (!roomId) {
          return socket.emit('error', { message: 'roomId is required.' });
        }
        if (!text && !imageUrl) {
          return socket.emit('error', { message: 'Message must have text or an image.' });
        }
        if (socket.user?.role !== 'student') {
          return socket.emit('error', { message: 'Only students can send messages.' });
        }

        // Find room document
        const room = await Room.findOne({ roomId });
        if (!room) {
          return socket.emit('error', { message: 'Room not found.' });
        }

        // Persist to MongoDB
        const message = await Message.create({
          room: room._id,
          sender: socket.user.id,
          senderName: socket.user.name,
          text: text || '',
          imageUrl: imageUrl || null,
        });

        const messageData = {
          _id: message._id,
          room: message.room,
          sender: { _id: socket.user.id, name: socket.user.name, email: socket.user.email },
          senderName: message.senderName,
          text: message.text,
          imageUrl: message.imageUrl,
          isDeleted: false,
          createdAt: message.createdAt,
        };

        // Broadcast to everyone in the room (including sender)
        io.to(roomId).emit('receiveMessage', messageData);
      } catch (err) {
        console.error('sendMessage error:', err);
        socket.emit('error', { message: 'Failed to send message.' });
      }
    });

    // ─── disconnect ──────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      if (socket.currentRoom) {
        removeParticipant(socket.currentRoom, socket.id);
        io.to(socket.currentRoom).emit('participantCount', getParticipantCount(socket.currentRoom));
      }
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });
};

// ─── Participant tracking helpers ─────────────────────────────────────────────

function addParticipant(roomId, socketId) {
  if (!roomParticipants.has(roomId)) {
    roomParticipants.set(roomId, new Set());
  }
  roomParticipants.get(roomId).add(socketId);
}

function removeParticipant(roomId, socketId) {
  if (roomParticipants.has(roomId)) {
    roomParticipants.get(roomId).delete(socketId);
    if (roomParticipants.get(roomId).size === 0) {
      roomParticipants.delete(roomId);
    }
  }
}

function getParticipantCount(roomId) {
  return roomParticipants.get(roomId)?.size || 0;
}

module.exports = { socketHandler, roomParticipants };
