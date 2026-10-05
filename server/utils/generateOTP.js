const crypto = require('crypto');

/**
 * Generates a cryptographically random 6-digit OTP string.
 * @returns {string} 6-digit OTP
 */
const generateOTP = () => {
  const otp = crypto.randomInt(100000, 999999).toString();
  return otp;
};

module.exports = generateOTP;
