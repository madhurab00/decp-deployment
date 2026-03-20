const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['direct', 'group'],
    required: true
  },
  memberIds: [{
    type: mongoose.Schema.Types.ObjectId,
    required: true
  }],
  memberSnapshots: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    fullName: {
      type: String,
      trim: true
    },
    role: {
      type: String,
      trim: true
    },
    headline: {
      type: String,
      trim: true
    },
    profilePicUrl: {
      type: String
    }
  }],
  title: {
    type: String // Optional, for groups
  },
  createdById: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  directKey: { // "minId:maxId" format to ensure uniqueness for direct chats
    type: String,
    sparse: true,
    unique: true
  },
  lastMessageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastMessageAt: {
    type: Date
  }
}, { timestamps: true });

conversationSchema.index({ memberIds: 1, lastMessageAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);
