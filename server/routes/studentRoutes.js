const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const requireRole = require('../middleware/requireRole');
const Subject = require('../models/Subject');
const Slot = require('../models/Slot');
const Faculty = require('../models/Faculty');

const router = express.Router();

// All student routes require student JWT
router.use(verifyToken, requireRole('student'));

/**
 * GET /api/student/subjects
 * Returns all active subjects for the dropdown.
 */
router.get('/subjects', async (req, res) => {
  try {
    const subjects = await Subject.find({ isActive: true }).select('name code').sort({ name: 1 });
    res.status(200).json({ success: true, data: subjects });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/student/slots
 * Returns all active slots.
 * (Cascading: all slots are available per subject for now — rooms are created on demand)
 */
router.get('/slots', async (req, res) => {
  try {
    const slots = await Slot.find({ isActive: true }).select('label timing').sort({ label: 1 });
    res.status(200).json({ success: true, data: slots });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/student/faculty
 * Returns all active faculty.
 */
router.get('/faculty', async (req, res) => {
  try {
    const faculty = await Faculty.find({ isActive: true }).select('name email').sort({ name: 1 });
    res.status(200).json({ success: true, data: faculty });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
