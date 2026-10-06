const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const { PutCommand, GetCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const Admin = require('../models/Admin');
const generateOTP = require('../utils/generateOTP');
const { docClient, OTP_TABLE_NAME } = require('../config/dynamodb');

// ─── Helper: issue JWT cookie ───────────────────────────────────────────────

const issueToken = (res, payload) => {
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
  res.cookie('token', token, {
    httpOnly: true,
    secure: true,       // required for sameSite:'none' — must always be true for cross-origin cookies
    sameSite: 'none',   // required for cross-origin cookie delivery (S3 frontend ↔ separate backend)
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

    // DEBUG 1 — log the email received on entry
    console.log(`\n[OTP REQUEST] Email received: ${email}`);
    console.log(`[OTP REQUEST] EMAIL_USER env: ${process.env.EMAIL_USER}`);
    console.log(`[OTP REQUEST] NODE_ENV: ${process.env.NODE_ENV}`);

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    // Always return the same generic message to prevent user enumeration
    const genericResponse = {
      success: true,
      message: 'If this email is registered, an OTP has been sent to it.',
    };

    // ─── DB-level debug: verify what we're querying against ─────────────────
    console.log('[OTP DEBUG] Querying for email:', JSON.stringify(email));
    console.log('[OTP DEBUG] Mongoose connection DB name:', mongoose.connection.name);
    console.log('[OTP DEBUG] Total admins in collection:', await Admin.countDocuments());

    const admin = await Admin.findOne({ email: email.toLowerCase() }).select('+otp +otpExpiresAt');

    if (!admin) {
      console.log(`[OTP REQUEST] No admin found for email: ${email} — returning generic response`);
      return res.status(200).json(genericResponse);
    }

    console.log(`[OTP REQUEST] Admin found: ${admin.name} <${admin.email}>`);

    // Generate OTP
    const otp = generateOTP();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    admin.otp = hashedOtp;
    admin.otpExpiresAt = otpExpiry;
    await admin.save();
    console.log(`[OTP REQUEST] OTP generated and saved (expires: ${otpExpiry.toISOString()})`);

    // DynamoDB: Write OTP item to CampusConnect-OTP (expires in 5 minutes / 300 seconds)
    const expiresAt = Math.floor(Date.now() / 1000) + 300;
    await docClient.send(
      new PutCommand({
        TableName: OTP_TABLE_NAME,
        Item: {
          email: admin.email,
          hashedOtp,
          expiresAt,
        },
      })
    );
    console.log('[DynamoDB] OTP written for: ' + email);

    // Send email
    try {
      // DEBUG 2 — log right before sending
      console.log(`[OTP REQUEST] Attempting to send OTP email to: ${admin.email}`);
      console.log(`[OTP REQUEST] Sending FROM: ${process.env.EMAIL_USER}`);

      const transporter = createTransporter();
      const result = await transporter.sendMail({
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

      // DEBUG 4 — log success with messageId
      console.log(`[OTP REQUEST] ✅ Email sent successfully, messageId: ${result.messageId}`);

    } catch (emailErr) {
      // DEBUG 3 — log the FULL error object, not just .message
      console.error('[OTP REQUEST] ❌ Email send FAILED — full error object below:');
      console.error(emailErr);
      console.error('[OTP REQUEST] Error name:', emailErr.name);
      console.error('[OTP REQUEST] Error code:', emailErr.code);
      console.error('[OTP REQUEST] Error command:', emailErr.command);
      console.error('[OTP REQUEST] Response:', emailErr.response);
      console.error('[OTP REQUEST] responseCode:', emailErr.responseCode);

      // In dev, log OTP to console as fallback so login can still be tested
      if (process.env.NODE_ENV === 'development') {
        console.log(`\n🔑 [DEV FALLBACK] OTP for ${admin.email}: ${otp}\n`);
      }
    }

    return res.status(200).json(genericResponse);
  } catch (err) {
    console.error('[OTP REQUEST] Outer catch — unexpected error:');
    console.error(err);
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

    const normalizedEmail = email.toLowerCase().trim();

    // ─── DynamoDB: Verify OTP as source of truth ───────────────────────────
    const { Item: otpItem } = await docClient.send(
      new GetCommand({
        TableName: OTP_TABLE_NAME,
        Key: { email: normalizedEmail },
      })
    );

    if (!otpItem || !otpItem.hashedOtp || !otpItem.expiresAt) {
      return res.status(401).json({ success: false, message: 'Invalid OTP or OTP has expired.' });
    }

    // Check expiry against DynamoDB expiresAt (Unix epoch seconds)
    const currentUnixTime = Math.floor(Date.now() / 1000);
    if (currentUnixTime > otpItem.expiresAt) {
      return res.status(401).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    // Compare submitted OTP against the stored hash in DynamoDB
    const isMatch = await bcrypt.compare(otp.toString(), otpItem.hashedOtp);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid OTP.' });
    }

    // Fetch admin details from MongoDB to issue JWT and user session
    const admin = await Admin.findOne({ email: normalizedEmail }).select('+otp +otpExpiresAt');
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Admin not found.' });
    }

    // Clear MongoDB OTP fields and record login timestamp
    admin.otp = undefined;
    admin.otpExpiresAt = undefined;
    admin.lastLoginAt = new Date();
    await admin.save();

    // Issue JWT cookie as before
    issueToken(res, {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: 'admin',
    });

    // Remove verified OTP item from DynamoDB
    await docClient.send(
      new DeleteCommand({
        TableName: OTP_TABLE_NAME,
        Key: { email: normalizedEmail },
      })
    );
    console.log('[DynamoDB] OTP verified and deleted for: ' + email);

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
    secure: true,
    sameSite: 'none',
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
