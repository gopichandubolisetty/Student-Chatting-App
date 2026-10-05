const Room = require('../models/Room');
const generateRoomId = require('../utils/generateRoomId');

/**
 * POST /api/rooms/find-or-create
 * Body: { subjectId, slotId, facultyId }
 * Finds or creates a Room for the given subject+slot+faculty combo.
 */
const findOrCreateRoom = async (req, res) => {
  try {
    const { subjectId, slotId, facultyId } = req.body;

    if (!subjectId || !slotId || !facultyId) {
      return res.status(400).json({
        success: false,
        message: 'subjectId, slotId, and facultyId are required.',
      });
    }

    const roomId = generateRoomId(subjectId, slotId, facultyId);

    const room = await Room.findOneAndUpdate(
      { subject: subjectId, slot: slotId, faculty: facultyId },
      {
        $setOnInsert: {
          subject: subjectId,
          slot: slotId,
          faculty: facultyId,
          roomId,
          isActive: true,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )
      .populate('subject', 'name code')
      .populate('slot', 'label timing')
      .populate('faculty', 'name email');

    res.status(200).json({ success: true, data: room });
  } catch (err) {
    console.error('findOrCreateRoom error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/rooms/:roomId
 * Returns room details by roomId string.
 */
const getRoomDetails = async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId })
      .populate('subject', 'name code')
      .populate('slot', 'label timing')
      .populate('faculty', 'name email');

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found.' });
    }
    res.status(200).json({ success: true, data: room });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { findOrCreateRoom, getRoomDetails };
