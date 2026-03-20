const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tokenHash: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 } // TTL index
  },
  revokedAt: {
    type: Date,
    default: null
  },
  deviceInfo: {
    type: String // Optional: e.g. "Chrome on Windows"
  }
});

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
