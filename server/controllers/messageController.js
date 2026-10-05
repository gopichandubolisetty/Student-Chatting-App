const Message = require('../models/Message');
const Room = require('../models/Room');

const MESSAGE_LIMIT = parseInt(process.env.MESSAGE_HISTORY_LIMIT) || 50;

/**
 * GET /api/rooms/:roomId/messages
 * Returns the last N messages for a room (for hydrating chat history on join).
 */
const getRoomMessages = async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found.' });
    }

    const messages = await Message.find({ room: room._id, isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(MESSAGE_LIMIT)
      .populate('sender', 'name email');

    // Reverse so oldest-first for display
    messages.reverse();

    res.status(200).json({ success: true, data: messages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/rooms/:roomId/messages/all (admin)
 * Returns all messages (including deleted, for moderation view).
 */
const getAllRoomMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found.' });
    }
    const messages = await Message.find({ room: room._id })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('sender', 'name email');

    messages.reverse();
    res.status(200).json({ success: true, data: messages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getRoomMessages, getAllRoomMessages };
