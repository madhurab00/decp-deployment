const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  media: [{
    url: String,
    type: { type: String, enum: ['image', 'video', 'document'] }
  }],
  visibility: {
    type: String,
    enum: ['public', 'dept', 'connections'],
    default: 'public'
  },
  tags: [{ type: String }],
  likeCount: { type: Number, default: 0 },
  commentCount: { type: Number, default: 0 },
  shareCount: { type: Number, default: 0 },
  authorSnapshot: { // For caching basic details
    name: String,
    profilePicUrl: String,
    headline: String
  }
}, { timestamps: true });

postSchema.index({ createdAt: -1 });
postSchema.index({ authorId: 1, createdAt: -1 });

module.exports = mongoose.model('Post', postSchema);
