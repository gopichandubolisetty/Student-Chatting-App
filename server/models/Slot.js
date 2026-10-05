const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: [true, 'Slot label is required'],
      trim: true,
      unique: true,
    },
    timing: {
      type: String,
      required: [true, 'Slot timing is required'],
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Slot', slotSchema);
