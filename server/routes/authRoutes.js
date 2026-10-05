const express = require('express');
const passport = require('passport');
const { googleCallback, adminRequestOTP, adminVerifyOTP, logout, getMe } = require('../controllers/authController');
const verifyToken = require('../middleware/verifyToken');

const router = express.Router();

// ─── Google OAuth ─────────────────────────────────────────────────────────────

// Initiate Google OAuth flow
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  })
);

// Google OAuth callback
router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:5173'}/?error=${encodeURIComponent('Authentication failed. Only @vitapstudent.ac.in accounts are allowed.')}`,
  }),
  googleCallback
);

// ─── Admin OTP ────────────────────────────────────────────────────────────────

router.post('/admin/request-otp', adminRequestOTP);
router.post('/admin/verify-otp', adminVerifyOTP);

// ─── Common ───────────────────────────────────────────────────────────────────

router.post('/logout', logout);
router.get('/me', verifyToken, getMe);

module.exports = router;
