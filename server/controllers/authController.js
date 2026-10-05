const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const Admin = require('../models/Admin');
const generateOTP = require('../utils/generateOTP');

// ─── Helper: issue JWT cookie ───────────────────────────────────────────────

const issueToken = (res, payload) => {
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
  return token;
};

// ─── Helper: Nodemailer transporter ─────────────────────────────────────────

const createTransporter = () =>
  nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

// ─── Google OAuth callback ──────────────────────────────────────────────────

const googleCallback = (req, res) => {
  try {
    if (!req.user) {
      // Domain restriction failed in passport strategy
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      return res.redirect(
        `${clientUrl}/?error=${encodeURIComponent('Only @vitapstudent.ac.in accounts are allowed.')}`
      );
    }

    const user = req.user;
    issueToken(res, {
      id: user._id,
      name: user.name,
      email: user.email,
      role: 'student',
    });

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    res.redirect(`${clientUrl}/dashboard`);
  } catch (err) {
    console.error('Google callback error:', err);
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    res.redirect(`${clientUrl}/?error=${encodeURIComponent('Authentication failed. Please try again.')}`);
  }
};

// ─── Admin: Request OTP ──────────────────────────────────────────────────────

const adminRequestOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    // Always return the same generic message to prevent user enumeration
    const genericResponse = {
      success: true,
      message: 'If this email is registered, an OTP has been sent to it.',
    };

    const admin = await Admin.findOne({ email: email.toLowerCase() }).select('+otp +otpExpiresAt');

    if (!admin) {
      return res.status(200).json(genericResponse);
    }

    // Generate OTP
    const otp = generateOTP();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    admin.otp = hashedOtp;
    admin.otpExpiresAt = otpExpiry;
    await admin.save();

    // Send email
    try {
      const transporter = createTransporter();
      await transporter.sendMail({
        from: `"CampusConnect Admin" <${process.env.EMAIL_USER}>`,
        to: admin.email,
        subject: 'CampusConnect Admin OTP',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
            <h2 style="color: #4F46E5;">CampusConnect Admin Login</h2>
            <p>Hello <strong>${admin.name}</strong>,</p>
            <p>Your one-time password (OTP) for logging into CampusConnect Admin Panel is:</p>
            <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
              <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #4F46E5;">${otp}</span>
            </div>
            <p style="color: #6b7280;">This OTP is valid for <strong>5 minutes</strong>. Do not share it with anyone.</p>
            <p style="color: #6b7280; font-size: 12px;">If you did not request this OTP, please ignore this email.</p>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error('Email send error:', emailErr);
      // In dev, log OTP to console as fallback
      if (process.env.NODE_ENV === 'development') {
        console.log(`\n🔑 [DEV] OTP for ${admin.email}: ${otp}\n`);
      }
    }

    return res.status(200).json(genericResponse);
  } catch (err) {
    console.error('Admin request OTP error:', err);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

// ─── Admin: Verify OTP ───────────────────────────────────────────────────────

const adminVerifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required.' });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase() }).select('+otp +otpExpiresAt');

    if (!admin || !admin.otp || !admin.otpExpiresAt) {
      return res.status(401).json({ success: false, message: 'Invalid OTP or OTP has expired.' });
    }

    // Check expiry
    if (new Date() > admin.otpExpiresAt) {
      admin.otp = undefined;
      admin.otpExpiresAt = undefined;
      await admin.save();
      return res.status(401).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    // Compare OTP
    const isMatch = await bcrypt.compare(otp.toString(), admin.otp);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid OTP.' });
    }

    // Clear OTP after successful use
    admin.otp = undefined;
    admin.otpExpiresAt = undefined;
    admin.lastLoginAt = new Date();
    await admin.save();

    issueToken(res, {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: 'admin',
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      user: { id: admin._id, name: admin.name, email: admin.email, role: 'admin' },
    });
  } catch (err) {
    console.error('Admin verify OTP error:', err);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

// ─── Logout ───────────────────────────────────────────────────────────────────

const logout = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  });
  return res.status(200).json({ success: true, message: 'Logged out successfully.' });
};

// ─── Get current user ─────────────────────────────────────────────────────────

const getMe = (req, res) => {
  return res.status(200).json({ success: true, user: req.user });
};

module.exports = {
  googleCallback,
  adminRequestOTP,
  adminVerifyOTP,
  logout,
  getMe,
};
