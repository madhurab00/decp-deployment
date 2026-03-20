const express = require('express');
const {
  applyToJob,
  createJob,
  deleteJob,
  getJobApplications,
  getMyApplications,
  listJobs,
  updateJob
} = require('../controllers/jobController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { asyncHandler } = require('../utils/asyncHandler');

const router = express.Router();

router.use(requireAuth);
router.get('/', asyncHandler(listJobs));
router.get('/applications/me', requireRole('student'), asyncHandler(getMyApplications));
router.post('/', requireRole('alumni', 'admin'), asyncHandler(createJob));
router.put('/:jobId', requireRole('alumni', 'admin'), asyncHandler(updateJob));
router.delete('/:jobId', requireRole('alumni', 'admin'), asyncHandler(deleteJob));
router.post('/:jobId/apply', requireRole('student'), asyncHandler(applyToJob));
router.get('/:jobId/applications', asyncHandler(getJobApplications));

module.exports = router;
