const Job = require('../models/Job');
const JobApplication = require('../models/JobApplication');
const { publishEvent } = require('../rabbitmq/connection');
const { buildAuthorSnapshot } = require('../services/snapshot');
const { parsePagination } = require('../utils/pagination');
const { createHttpError, sendSuccess } = require('../utils/response');
const {
  ensureObjectId,
  normalizeMedia,
  normalizeStringArray,
  requireFutureDate,
  requireNonEmptyString
} = require('../utils/validators');

const mapJob = (job, currentUserId) => ({
  _id: job._id,
  postedById: job.postedById,
  title: job.title,
  companyName: job.companyName,
  type: job.type,
  mode: job.mode,
  location: job.location,
  description: job.description,
  requirements: job.requirements,
  deadline: job.deadline,
  status: job.status,
  applyUrl: job.applyUrl,
  media: job.media,
  applicationCount: job.applicationCount,
  postedBySnapshot: job.postedBySnapshot,
  createdAt: job.createdAt,
  updatedAt: job.updatedAt,
  isOwner: currentUserId ? job.postedById.toString() === currentUserId.toString() : false,
  company: job.companyName,
  postedBy: {
    _id: job.postedById,
    ...job.postedBySnapshot
  },
  applicants: job.applicationCount
});

const getOwnedJob = async (jobId, user) => {
  const job = await Job.findById(jobId);
  if (!job) {
    throw createHttpError(404, 'Job not found');
  }

  const isOwner = job.postedById.toString() === user.id.toString();
  const isAdmin = user.role === 'admin';

  if (!isOwner && !isAdmin) {
    throw createHttpError(403, 'You do not have permission to modify this job');
  }

  return job;
};

const mapApplication = (application) => ({
  _id: application._id,
  jobId: application.jobId,
  applicantId: application.applicantId,
  applicantSnapshot: application.applicantSnapshot,
  resumeUrl: application.resumeUrl,
  coverLetter: application.coverLetter,
  status: application.status,
  createdAt: application.createdAt,
  updatedAt: application.updatedAt,
  applicant: {
    _id: application.applicantId,
    ...application.applicantSnapshot
  },
  appliedAt: application.createdAt
});

const createJob = async (req, res) => {
  const title = requireNonEmptyString(req.body.title, 'title', 'Job title');
  const companyName = requireNonEmptyString(
    req.body.companyName || req.body.company,
    'companyName',
    'Company name'
  );
  const description = requireNonEmptyString(
    req.body.description,
    'description',
    'Job description'
  );
  const type = ['internship', 'fulltime', 'parttime', 'contract'].includes(req.body.type)
    ? req.body.type
    : null;
  const mode = ['remote', 'onsite', 'hybrid'].includes(req.body.mode) ? req.body.mode : null;

  if (!type || !mode) {
    throw createHttpError(400, 'Validation error', [
      { field: !type ? 'type' : 'mode', message: 'Invalid value' }
    ]);
  }

  const deadline = requireFutureDate(req.body.deadline, 'deadline');

  const job = await Job.create({
    postedById: req.user.id,
    companyName,
    title,
    type,
    mode,
    location: typeof req.body.location === 'string' ? req.body.location.trim() : '',
    description,
    requirements: normalizeStringArray(req.body.requirements),
    deadline,
    applyUrl: typeof req.body.applyUrl === 'string' ? req.body.applyUrl.trim() : '',
    media: normalizeMedia(req.body.media, ['image']),
    postedBySnapshot: buildAuthorSnapshot(req.user)
  });

  await publishEvent('decp_events', 'job.posted', {
    jobId: job._id.toString(),
    postedById: req.user.id,
    postedBySnapshot: job.postedBySnapshot,
    title: job.title,
    companyName: job.companyName
  });

  return sendSuccess(res, 201, mapJob(job, req.user.id), 'Job created successfully');
};

const listJobs = async (req, res) => {
  const { limit, page, skip } = parsePagination(req.query);
  const query = {};

  if (req.query.status && ['open', 'closed'].includes(req.query.status)) {
    query.status = req.query.status;
  }

  if (req.query.type && ['internship', 'fulltime', 'parttime', 'contract'].includes(req.query.type)) {
    query.type = req.query.type;
  }

  if (req.query.mode && ['remote', 'onsite', 'hybrid'].includes(req.query.mode)) {
    query.mode = req.query.mode;
  }

  if (req.query.postedById) {
    ensureObjectId(req.query.postedById, 'postedById');
    query.postedById = req.query.postedById;
  }

  if (req.query.search) {
    query.$text = { $search: req.query.search };
  }

  const [jobs, total] = await Promise.all([
    Job.find(query)
      .sort(req.query.search ? { score: { $meta: 'textScore' }, createdAt: -1 } : { createdAt: -1 })
      .select(req.query.search ? { score: { $meta: 'textScore' } } : {})
      .skip(skip)
      .limit(limit)
      .lean(),
    Job.countDocuments(query)
  ]);

  return sendSuccess(
    res,
    200,
    {
      items: jobs.map((job) => mapJob(job, req.user.id)),
      page,
      limit,
      total
    },
    'Jobs fetched successfully'
  );
};

const applyToJob = async (req, res) => {
  ensureObjectId(req.params.jobId, 'jobId');

  const job = await Job.findById(req.params.jobId);
  if (!job) {
    throw createHttpError(404, 'Job not found');
  }

  if (job.status !== 'open') {
    throw createHttpError(400, 'Job is not accepting applications');
  }

  if (job.deadline < new Date()) {
    throw createHttpError(400, 'Job application deadline has passed');
  }

  const existingApplication = await JobApplication.findOne({
    jobId: job._id,
    applicantId: req.user.id
  });

  if (existingApplication) {
    throw createHttpError(409, 'You have already applied to this job');
  }

  const application = await JobApplication.create({
    jobId: job._id,
    applicantId: req.user.id,
    applicantSnapshot: buildAuthorSnapshot(req.user),
    resumeUrl: typeof req.body.resumeUrl === 'string' ? req.body.resumeUrl.trim() : '',
    coverLetter: typeof req.body.coverLetter === 'string' ? req.body.coverLetter.trim() : ''
  });

  job.applicationCount += 1;
  await job.save();

  await publishEvent('decp_events', 'job.applied', {
    jobId: job._id.toString(),
    applicantId: req.user.id,
    applicantSnapshot: application.applicantSnapshot,
    postedById: job.postedById.toString(),
    title: job.title
  });

  return sendSuccess(res, 201, mapApplication(application), 'Job application submitted successfully');
};

const getMyApplications = async (req, res) => {
  const applications = await JobApplication.find({ applicantId: req.user.id })
    .sort({ createdAt: -1 })
    .lean();

  return sendSuccess(
    res,
    200,
    applications.map(mapApplication),
    'Your job applications fetched successfully'
  );
};

const updateJob = async (req, res) => {
  ensureObjectId(req.params.jobId, 'jobId');

  const job = await getOwnedJob(req.params.jobId, req.user);
  const title = requireNonEmptyString(req.body.title, 'title', 'Job title');
  const companyName = requireNonEmptyString(
    req.body.companyName || req.body.company,
    'companyName',
    'Company name'
  );
  const description = requireNonEmptyString(req.body.description, 'description', 'Job description');
  const type = ['internship', 'fulltime', 'parttime', 'contract'].includes(req.body.type)
    ? req.body.type
    : null;
  const mode = ['remote', 'onsite', 'hybrid'].includes(req.body.mode) ? req.body.mode : null;

  if (!type || !mode) {
    throw createHttpError(400, 'Validation error', [
      { field: !type ? 'type' : 'mode', message: 'Invalid value' }
    ]);
  }

  job.title = title;
  job.companyName = companyName;
  job.description = description;
  job.type = type;
  job.mode = mode;
  job.location = typeof req.body.location === 'string' ? req.body.location.trim() : '';
  job.requirements = normalizeStringArray(req.body.requirements);
  job.deadline = requireFutureDate(req.body.deadline, 'deadline');
  job.applyUrl = typeof req.body.applyUrl === 'string' ? req.body.applyUrl.trim() : '';
  job.media = normalizeMedia(req.body.media, ['image']);

  await job.save();

  return sendSuccess(res, 200, mapJob(job, req.user.id), 'Job updated successfully');
};

const deleteJob = async (req, res) => {
  ensureObjectId(req.params.jobId, 'jobId');

  const job = await getOwnedJob(req.params.jobId, req.user);

  await Promise.all([
    JobApplication.deleteMany({ jobId: job._id }),
    Job.deleteOne({ _id: job._id })
  ]);

  return sendSuccess(res, 200, null, 'Job deleted successfully');
};

const getJobApplications = async (req, res) => {
  ensureObjectId(req.params.jobId, 'jobId');

  const job = await Job.findById(req.params.jobId);
  if (!job) {
    throw createHttpError(404, 'Job not found');
  }

  const isOwner = job.postedById.toString() === req.user.id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    throw createHttpError(403, 'You do not have permission to view these applications');
  }

  const applications = await JobApplication.find({ jobId: job._id })
    .sort({ createdAt: -1 })
    .lean();

  return sendSuccess(
    res,
    200,
    applications.map(mapApplication),
    'Job applications fetched successfully'
  );
};

module.exports = {
  applyToJob,
  createJob,
  deleteJob,
  getJobApplications,
  getMyApplications,
  listJobs
  ,
  updateJob
};
