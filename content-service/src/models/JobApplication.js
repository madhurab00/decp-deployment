const mongoose = require('mongoose');

const jobApplicationSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  applicantId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  applicantSnapshot: {
    name: String,
    profilePicUrl: String,
    headline: String
  },
  resumeUrl: { type: String },
  coverLetter: { type: String },
  status: {
    type: String,
    enum: ['submitted', 'reviewing', 'accepted', 'rejected'],
    default: 'submitted'
  }
}, { timestamps: true });

jobApplicationSchema.index({ jobId: 1, applicantId: 1 }, { unique: true }); // One application per job per user
jobApplicationSchema.index({ applicantId: 1, createdAt: -1 });
jobApplicationSchema.index({ jobId: 1, createdAt: -1 });

module.exports = mongoose.model('JobApplication', jobApplicationSchema);
