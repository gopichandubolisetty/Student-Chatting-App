const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const { findOrCreateRoom, getRoomDetails } = require('../controllers/roomController');
const { getRoomMessages } = require('../controllers/messageController');
const { upload } = require('../config/cloudinary');

const router = express.Router();

// All room routes require authentication (any role)
router.use(verifyToken);

/**
 * POST /api/rooms/find-or-create
 * Find or create a room for the given subject/slot/faculty combo.
 */
router.post('/find-or-create', findOrCreateRoom);

/**
 * POST /api/rooms/upload-image
 * Upload an image to Cloudinary and return the URL.
 * IMPORTANT: declared BEFORE /:roomId to prevent Express matching
 * "upload-image" as a dynamic roomId param on any future GET routes.
 */
router.post('/upload-image', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided.' });
    }
    res.status(200).json({ success: true, imageUrl: req.file.path });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/rooms/:roomId
 * Get room details.
 */
router.get('/:roomId', getRoomDetails);

/**
 * GET /api/rooms/:roomId/messages
 * Get message history for a room.
 */
router.get('/:roomId/messages', getRoomMessages);

module.exports = router;
