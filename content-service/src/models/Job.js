const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  postedById: {
    type: mongoose.Schema.Types.ObjectId, // User who posted it
    required: true
  },
  companyName: { type: String, required: true },
  title: { type: String, required: true },
  type: {
    type: String,
    enum: ['internship', 'fulltime', 'parttime', 'contract'],
    required: true
  },
  mode: {
    type: String,
    enum: ['remote', 'onsite', 'hybrid'],
    required: true
  },
  location: { type: String },
  description: { type: String, required: true },
  requirements: [{ type: String }],
  deadline: { type: Date, required: true },
  status: {
    type: String,
    enum: ['open', 'closed'],
    default: 'open'
  },
  applyUrl: { type: String }, // External URL
  media: [{
    url: String, // Logo/banner
    type: { type: String, enum: ['image'] }
  }],
  applicationCount: { type: Number, default: 0 },
  postedBySnapshot: { // For caching basic details
    name: String,
    profilePicUrl: String
  }
}, { timestamps: true });

jobSchema.index({ createdAt: -1 });
jobSchema.index({ status: 1, createdAt: -1 });
// Text index for searching
jobSchema.index({ title: 'text', companyName: 'text', description: 'text' });

module.exports = mongoose.model('Job', jobSchema);
