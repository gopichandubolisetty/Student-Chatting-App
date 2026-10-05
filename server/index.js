require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const passport = require('./config/passport');
const connectDB = require('./config/db');
const { socketHandler } = require('./sockets/socketHandler');

// ─── Routes ───────────────────────────────────────────────────────────────────
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const studentRoutes = require('./routes/studentRoutes');
const roomRoutes = require('./routes/roomRoutes');

const app = express();
const httpServer = http.createServer(app);

// ─── Allowed origins (local dev + deployed S3 frontend) ──────────────────────
const ALLOWED_ORIGINS = [
  'http://student-chat-hub-frontend.s3-website-ap-southeast-2.amazonaws.com',
  'http://localhost:5173',
  // Also allow CLIENT_URL from env if set to something else
  ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : []),
].filter((v, i, a) => a.indexOf(v) === i); // deduplicate

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin '${origin}' is not allowed.`));
  },
  credentials: true,
};

// ─── Socket.io ────────────────────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Make io accessible in controllers (e.g., for admin soft-delete broadcast)
app.set('io', io);

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/rooms', roomRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'CampusConnect API is running.' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: err.message || 'Internal server error.' });
});

// ─── Socket Handler ───────────────────────────────────────────────────────────
socketHandler(io);

// ─── Start server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`🚀 CampusConnect server running on http://localhost:${PORT}`);
    console.log(`🌐 Accepting requests from: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
  });
});
