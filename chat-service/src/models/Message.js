const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  attachments: [{
    url: String,
    type: { type: String, enum: ['image', 'video', 'document'] }
  }],
  replyToMessageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  editedAt: { type: Date },
  deletedAt: { type: Date }
}, { timestamps: true });

messageSchema.index({ conversationId: 1, createdAt: 1 });
messageSchema.index({ senderId: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
