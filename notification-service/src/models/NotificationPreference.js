const mongoose = require('mongoose');

const preferenceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    unique: true
  },
  channels: {
    inApp: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    email: { type: Boolean, default: true }
  },
  mutedTypes: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('NotificationPreference', preferenceSchema);
