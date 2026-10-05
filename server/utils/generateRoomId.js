const crypto = require('crypto');

/**
 * Generates a deterministic, human-readable room ID from subject, slot, and faculty ObjectId strings.
 * Format: <subjectCode>-<slotLabel>-<hash>
 * @param {string} subjectId
 * @param {string} slotId
 * @param {string} facultyId
 * @returns {string}
 */
const generateRoomId = (subjectId, slotId, facultyId) => {
  const hash = crypto
    .createHash('sha256')
    .update(`${subjectId}-${slotId}-${facultyId}`)
    .digest('hex')
    .slice(0, 10);
  return `room-${hash}`;
};

module.exports = generateRoomId;
