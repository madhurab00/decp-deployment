const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { // receiver
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  type: {
    type: String,
    enum: ['POST_LIKED', 'COMMENT_ADDED', 'JOB_APPLIED', 'JOB_POSTED', 'MESSAGE_RECEIVED', 'CONNECTION_REQUEST'],
    required: true
  },
  title: { type: String, required: true },
  body: { type: String, required: true },
  data: {
    type: Map,
    of: String // deep link payload (e.g. postId, jobId)
  },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date }
}, { timestamps: true });

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
