const Subject = require('../models/Subject');
const Slot = require('../models/Slot');
const Faculty = require('../models/Faculty');
const Room = require('../models/Room');
const Message = require('../models/Message');

// ─── SUBJECTS ────────────────────────────────────────────────────────────────

const getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find().populate('createdBy', 'name email').sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: subjects });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createSubject = async (req, res) => {
  try {
    const { name, code } = req.body;
    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'Name and code are required.' });
    }
    const subject = await Subject.create({ name, code, createdBy: req.user.id });
    res.status(201).json({ success: true, data: subject });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'Subject code already exists.' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateSubject = async (req, res) => {
  try {
    const { name, code, isActive } = req.body;
    const subject = await Subject.findByIdAndUpdate(
      req.params.id,
      { name, code, isActive },
      { new: true, runValidators: true }
    );
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found.' });
    res.status(200).json({ success: true, data: subject });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'Subject code already exists.' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findByIdAndDelete(req.params.id);
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found.' });
    res.status(200).json({ success: true, message: 'Subject deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── SLOTS ────────────────────────────────────────────────────────────────────

const getSlots = async (req, res) => {
  try {
    const slots = await Slot.find().sort({ label: 1 });
    res.status(200).json({ success: true, data: slots });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createSlot = async (req, res) => {
  try {
    const { label, timing } = req.body;
    if (!label || !timing) {
      return res.status(400).json({ success: false, message: 'Label and timing are required.' });
    }
    const slot = await Slot.create({ label, timing });
    res.status(201).json({ success: true, data: slot });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'Slot label already exists.' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateSlot = async (req, res) => {
  try {
    const { label, timing, isActive } = req.body;
    const slot = await Slot.findByIdAndUpdate(
      req.params.id,
      { label, timing, isActive },
      { new: true, runValidators: true }
    );
    if (!slot) return res.status(404).json({ success: false, message: 'Slot not found.' });
    res.status(200).json({ success: true, data: slot });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'Slot label already exists.' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteSlot = async (req, res) => {
  try {
    const slot = await Slot.findByIdAndDelete(req.params.id);
    if (!slot) return res.status(404).json({ success: false, message: 'Slot not found.' });
    res.status(200).json({ success: true, message: 'Slot deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── FACULTY ──────────────────────────────────────────────────────────────────

const getFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.find().sort({ name: 1 });
    res.status(200).json({ success: true, data: faculty });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createFaculty = async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required.' });
    }
    const faculty = await Faculty.create({ name, email });
    res.status(201).json({ success: true, data: faculty });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'Faculty email already exists.' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateFaculty = async (req, res) => {
  try {
    const { name, email, isActive } = req.body;
    const faculty = await Faculty.findByIdAndUpdate(
      req.params.id,
      { name, email, isActive },
      { new: true, runValidators: true }
    );
    if (!faculty) return res.status(404).json({ success: false, message: 'Faculty not found.' });
    res.status(200).json({ success: true, data: faculty });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'Faculty email already exists.' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.findByIdAndDelete(req.params.id);
    if (!faculty) return res.status(404).json({ success: false, message: 'Faculty not found.' });
    res.status(200).json({ success: true, message: 'Faculty deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── ROOMS (Admin view) ───────────────────────────────────────────────────────

const getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ isActive: true })
      .populate('subject', 'name code')
      .populate('slot', 'label timing')
      .populate('faculty', 'name email')
      .sort({ createdAt: -1 });

    // Attach participant count from socket map if available
    const io = req.app.get('io');
    const roomsWithCounts = rooms.map((room) => {
      let participantCount = 0;
      if (io) {
        const socketRoom = io.sockets.adapter.rooms.get(room.roomId);
        participantCount = socketRoom ? socketRoom.size : 0;
      }
      return { ...room.toObject(), participantCount };
    });

    res.status(200).json({ success: true, data: roomsWithCounts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── MESSAGE MODERATION ───────────────────────────────────────────────────────

const softDeleteMessage = async (req, res) => {
  try {
    const message = await Message.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true }
    );
    if (!message) return res.status(404).json({ success: false, message: 'Message not found.' });

    // Notify clients in the room via socket.
    // Socket rooms are keyed by the roomId STRING (e.g. "room-abc123"),
    // NOT by the Room ObjectId — so we must look up the Room first.
    const io = req.app.get('io');
    if (io) {
      const Room = require('../models/Room');
      const room = await Room.findById(message.room).select('roomId');
      if (room?.roomId) {
        io.to(room.roomId).emit('messageDeleted', { messageId: message._id });
      }
    }

    res.status(200).json({ success: true, message: 'Message deleted.', data: message });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  getSlots,
  createSlot,
  updateSlot,
  deleteSlot,
  getFaculty,
  createFaculty,
  updateFaculty,
  deleteFaculty,
  getAllRooms,
  softDeleteMessage,
};
