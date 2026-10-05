const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      trim: true,
    },
    imageUrl: {
      type: String,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// At least one of text or imageUrl must be present
messageSchema.pre('validate', function (next) {
  if (!this.text && !this.imageUrl) {
    this.invalidate('text', 'Message must have text or an image.');
  }
  next();
});

module.exports = mongoose.model('Message', messageSchema);
