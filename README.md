# CampusConnect 🎓

A real-time student chat platform for course-slot-based discussion rooms. Students log in with Google (restricted to `@vitapstudent.ac.in`), select their Subject, Slot, and Faculty, and join a shared live chat room.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React (Vite), TailwindCSS v3, React Router, Axios, Socket.io-client |
| Backend | Node.js, Express.js, Socket.io |
| Database | MongoDB Atlas (Mongoose) |
| Auth | Google OAuth 2.0 (students), Email + OTP (admins), JWT (httpOnly cookie) |
| File Upload | Cloudinary |

---

## Project Structure

```
CampusConnect-Cursor/
├── package.json          ← root scripts (concurrently)
├── client/               ← React Vite app
│   ├── src/
│   │   ├── context/      AuthContext.jsx
│   │   ├── services/     api.js, socket.js
│   │   ├── pages/        StudentLogin, AdminLogin, AdminOTP, StudentDashboard, ChatRoom, AdminDashboard
│   │   ├── components/   Navbar, ChatBubble, Modal, Spinner, ProtectedRoute
│   │   └── utils/        dateUtils.js
│   └── .env.example
└── server/               ← Express + Socket.io API
    ├── config/           db.js, cloudinary.js, passport.js
    ├── models/           User, Admin, Subject, Slot, Faculty, Room, Message
    ├── controllers/      authController, adminController, roomController, messageController
    ├── routes/           authRoutes, adminRoutes, studentRoutes, roomRoutes
    ├── middleware/       verifyToken.js, requireRole.js
    ├── sockets/          socketHandler.js
    ├── utils/            generateOTP.js, generateRoomId.js
    ├── index.js
    └── .env.example
```

---

## Setup Guide

### 1. Clone & Install

```bash
# Install root deps (concurrently)
npm install

# Install server deps
cd server && npm install

# Install client deps
cd ../client && npm install
```

### 2. Create `.env` files

**`server/.env`** — copy from `.env.example` and fill in:

```env
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/campusconnect?retryWrites=true&w=majority
JWT_SECRET=some_long_random_string_here
JWT_EXPIRES_IN=7d

GOOGLE_CLIENT_ID=<your Google OAuth Client ID>
GOOGLE_CLIENT_SECRET=<your Google OAuth Client Secret>
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

CLIENT_URL=http://localhost:5173

CLOUDINARY_CLOUD_NAME=<your cloud name>
CLOUDINARY_API_KEY=<your api key>
CLOUDINARY_API_SECRET=<your api secret>

EMAIL_USER=youremail@gmail.com
EMAIL_PASS=<Gmail App Password — NOT your Gmail password>

PORT=5000
NODE_ENV=development
```

**`client/.env`** — copy from `.env.example`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### 3. Google Cloud Console — OAuth Setup

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project → APIs & Services → Credentials
3. Create an **OAuth 2.0 Client ID** (Web Application)
4. Add Authorized JavaScript origins: `http://localhost:5173`
5. Add Authorized redirect URIs: `http://localhost:5000/api/auth/google/callback`
6. Copy the **Client ID** and **Client Secret** into `server/.env`

### 4. MongoDB Atlas

1. Create a free cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Under **Network Access**, allow your IP (or `0.0.0.0/0` for dev)
3. Under **Database Access**, create a user with read/write rights
4. Copy the connection string into `MONGO_URI` in `server/.env`

### 5. Cloudinary Setup

1. Create a free account at [cloudinary.com](https://cloudinary.com)
2. Copy **Cloud Name**, **API Key**, **API Secret** from the Dashboard into `server/.env`

### 6. Gmail App Password (for OTP email)

1. Enable 2-Step Verification on your Google account
2. Go to Google Account → Security → App Passwords
3. Generate an App Password (type: Mail)
4. Use this password (not your Gmail password) as `EMAIL_PASS`

> **Dev tip**: If you don't set up email, the OTP is printed to the server console in `development` mode. Check the terminal when requesting an OTP.

### 7. Seed the first Admin account

Connect to MongoDB Atlas (via Compass or the Atlas shell) and run:

```javascript
use campusconnect

db.admins.insertOne({
  name: "Your Name",
  email: "youremail@example.com",
  role: "admin",
  createdAt: new Date(),
  updatedAt: new Date()
})
```

> The email here must match what you type on the Admin Login page. There is **no admin signup** — all admins are pre-seeded manually.

---

## Running Locally

From the project root:

```bash
npm run dev
```

This starts:
- **Server** at `http://localhost:5000` (nodemon, hot-reload)
- **Client** at `http://localhost:5173` (Vite dev server)

Or run them separately:
```bash
npm run server   # server only
npm run client   # client only
```

---

## URLs

| URL | Description |
|-----|-------------|
| `http://localhost:5173/` | Student login (Google OAuth) |
| `http://localhost:5173/dashboard` | Student dashboard (dropdown → join room) |
| `http://localhost:5173/room/:roomId` | Chat room |
| `http://localhost:5173/admin/login` | Admin email entry |
| `http://localhost:5173/admin/otp` | Admin OTP verification |
| `http://localhost:5173/admin/dashboard` | Admin management panel |
| `http://localhost:5000/api/health` | API health check |

---

## API Overview

### Auth
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/auth/google` | Initiate Google OAuth |
| GET | `/api/auth/google/callback` | Google OAuth callback |
| POST | `/api/auth/admin/request-otp` | Request OTP (email) |
| POST | `/api/auth/admin/verify-otp` | Verify OTP → issue JWT |
| POST | `/api/auth/logout` | Clear JWT cookie |
| GET | `/api/auth/me` | Get current user |

### Student (requires `student` JWT)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/student/subjects` | List active subjects |
| GET | `/api/student/slots` | List active slots |
| GET | `/api/student/faculty` | List active faculty |

### Rooms (requires JWT)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/rooms/find-or-create` | Find or create room |
| GET | `/api/rooms/:roomId` | Room details |
| GET | `/api/rooms/:roomId/messages` | Last 50 messages |
| POST | `/api/rooms/upload-image` | Upload image to Cloudinary |

### Admin (requires `admin` JWT)
| Method | Path | Description |
|--------|------|-------------|
| GET/POST/PUT/DELETE | `/api/admin/subjects/:id?` | Subject CRUD |
| GET/POST/PUT/DELETE | `/api/admin/slots/:id?` | Slot CRUD |
| GET/POST/PUT/DELETE | `/api/admin/faculty/:id?` | Faculty CRUD |
| GET | `/api/admin/rooms` | All rooms + participant counts |
| GET | `/api/admin/rooms/:roomId/messages` | All messages (incl. deleted) |
| DELETE | `/api/admin/messages/:id` | Soft-delete a message |

### Socket Events
| Event | Direction | Payload |
|-------|-----------|---------|
| `joinRoom` | Client → Server | `{ roomId }` |
| `adminJoinRoom` | Admin → Server | `{ roomId }` |
| `sendMessage` | Client → Server | `{ roomId, text, imageUrl }` |
| `receiveMessage` | Server → Client | Message object |
| `messageDeleted` | Server → Client | `{ messageId }` |
| `participantCount` | Server → Client | `number` |

---

## Notes

- OTPs expire after **5 minutes**
- Image uploads are capped at **5MB**
- Message history loads the last **50 messages** on room join
- Admin accounts are **never** created through the app — always seed manually
- Soft-deleted messages show as "🚫 Message deleted by admin" in the chat UI
