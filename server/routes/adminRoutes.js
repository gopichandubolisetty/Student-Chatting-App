const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const requireRole = require('../middleware/requireRole');
const {
  getSubjects, createSubject, updateSubject, deleteSubject,
  getSlots, createSlot, updateSlot, deleteSlot,
  getFaculty, createFaculty, updateFaculty, deleteFaculty,
  getAllRooms, softDeleteMessage,
} = require('../controllers/adminController');
const { getAllRoomMessages } = require('../controllers/messageController');

const router = express.Router();

// All admin routes require admin JWT
router.use(verifyToken, requireRole('admin'));

// ─── Subjects ─────────────────────────────────────────────────────────────────
router.get('/subjects', getSubjects);
router.post('/subjects', createSubject);
router.put('/subjects/:id', updateSubject);
router.delete('/subjects/:id', deleteSubject);

// ─── Slots ────────────────────────────────────────────────────────────────────
router.get('/slots', getSlots);
router.post('/slots', createSlot);
router.put('/slots/:id', updateSlot);
router.delete('/slots/:id', deleteSlot);

// ─── Faculty ──────────────────────────────────────────────────────────────────
router.get('/faculty', getFaculty);
router.post('/faculty', createFaculty);
router.put('/faculty/:id', updateFaculty);
router.delete('/faculty/:id', deleteFaculty);

// ─── Rooms ────────────────────────────────────────────────────────────────────
router.get('/rooms', getAllRooms);

// ─── Message Moderation ───────────────────────────────────────────────────────
router.delete('/messages/:id', softDeleteMessage);
router.get('/rooms/:roomId/messages', getAllRoomMessages);

module.exports = router;
