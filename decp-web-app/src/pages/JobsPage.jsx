import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { contentApi } from '../config/api';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, Briefcase, Clock, MapPin, MoreHorizontal, Users, X } from 'lucide-react';

export default function JobsPage() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [showCreateJob, setShowCreateJob] = useState(false);
  const [showApplyJob, setShowApplyJob] = useState(false);
  const [showApplicants, setShowApplicants] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobApplicants, setJobApplicants] = useState([]);
  const [appliedJobs, setAppliedJobs] = useState(new Set());
  const [filter, setFilter] = useState('all');
  const [jobForm, setJobForm] = useState({
    title: '',
    company: '',
    description: '',
    location: '',
    type: 'internship',
    deadline: '',
  });
  const [applicationForm, setApplicationForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    resumeUrl: '',
    coverLetter: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isJobsLoading, setIsJobsLoading] = useState(true);
  const [isApplicantsLoading, setIsApplicantsLoading] = useState(false);
  const [editingJobId, setEditingJobId] = useState(null);
  const [openJobMenuId, setOpenJobMenuId] = useState(null);
  const currentUserSnapshot = {
    name: user?.fullName || 'Unknown User',
    profilePicUrl: user?.profilePicUrl || '',
    headline: user?.headline || '',
  };

  useEffect(() => {
    const loadJobs = async () => {
      try {
        setIsJobsLoading(true);
        setError('');
        const jobsRequest = contentApi.get('/api/jobs');
        const applicationsRequest = user?.role === 'student'
          ? contentApi.get('/api/jobs/applications/me')
          : Promise.resolve({ data: { data: [] } });

        const [jobsResponse, applicationsResponse] = await Promise.all([
          jobsRequest,
          applicationsRequest
        ]);

        setJobs(jobsResponse.data.data.items || []);
        if (user?.role === 'student') {
          setAppliedJobs(
            new Set((applicationsResponse.data.data || []).map((application) => application.jobId))
          );
        }
      } catch (err) {
        console.error('Failed to fetch jobs:', err);
        setError(err.response?.data?.message || 'Failed to load jobs');
      } finally {
        setIsJobsLoading(false);
      }
    };

    loadJobs();
  }, [user?.role]);

  useEffect(() => {
    setShowCreateJob(location.pathname === '/create-job');
  }, [location.pathname]);

  const isAlumniOrAdmin = user?.role === 'alumni' || user?.role === 'admin';

  useEffect(() => {
    setApplicationForm((currentForm) => ({
      ...currentForm,
      fullName: user?.fullName || '',
      email: user?.email || '',
    }));
  }, [user]);

  const handleCreateJob = async (e) => {
    e.preventDefault();
    setError('');

    if (!jobForm.title || !jobForm.company || !jobForm.description || !jobForm.deadline) {
      setError('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        title: jobForm.title,
        companyName: jobForm.company,
        description: jobForm.description,
        location: jobForm.location,
        type: jobForm.type,
        mode: 'remote',
        deadline: `${jobForm.deadline}T23:59:59.000Z`,
        snapshot: currentUserSnapshot,
      };

      if (editingJobId) {
        await contentApi.put(`/api/jobs/${editingJobId}`, payload);
      } else {
        await contentApi.post('/api/jobs', payload);
      }

      const refreshedJobs = await contentApi.get('/api/jobs');
      setJobs(refreshedJobs.data.data.items || []);
      setJobForm({
        title: '',
        company: '',
        description: '',
        location: '',
        type: 'internship',
        deadline: '',
      });
      setEditingJobId(null);
      setShowCreateJob(false);
      navigate('/jobs');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create job posting');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyJob = async (e) => {
    e.preventDefault();
    if (!selectedJob) {
      return;
    }

    try {
      await contentApi.post(`/api/jobs/${selectedJob._id}/apply`, {
        resumeUrl: applicationForm.resumeUrl,
        snapshot: currentUserSnapshot,
        coverLetter: [
          `Applicant: ${applicationForm.fullName}`,
          applicationForm.email ? `Email: ${applicationForm.email}` : '',
          applicationForm.phone ? `Phone: ${applicationForm.phone}` : '',
          '',
          applicationForm.coverLetter
        ].filter(Boolean).join('\n')
      });

      setAppliedJobs((currentAppliedJobs) => new Set(currentAppliedJobs).add(selectedJob._id));
      setJobs((currentJobs) =>
        currentJobs.map((job) =>
          job._id === selectedJob._id
            ? {
                ...job,
                applicationCount: (job.applicationCount || 0) + 1,
                applicants: (job.applicants || 0) + 1,
              }
            : job
        )
      );
      setShowApplyJob(false);
      setSelectedJob(null);
      setApplicationForm({
        fullName: user?.fullName || '',
        email: user?.email || '',
        phone: '',
        resumeUrl: '',
        coverLetter: '',
      });
    } catch (err) {
      if (err.response?.status === 409) {
        setAppliedJobs((currentAppliedJobs) => new Set(currentAppliedJobs).add(selectedJob._id));
        setShowApplyJob(false);
        setError('You have already applied to this job');
        return;
      }

      setError(err.response?.data?.message || 'Failed to apply for job');
    }
  };

  const openApplyModal = (job) => {
    setError('');
    setSelectedJob(job);
    setApplicationForm((currentForm) => ({
      ...currentForm,
      fullName: user?.fullName || '',
      email: user?.email || '',
      phone: '',
      resumeUrl: '',
      coverLetter: '',
    }));
    setShowApplyJob(true);
  };

  const openApplicantsModal = async (job) => {
    try {
      setError('');
      setSelectedJob(job);
      setShowApplicants(true);
      setIsApplicantsLoading(true);
      const response = await contentApi.get(`/api/jobs/${job._id}/applications`);
      setJobApplicants(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load applicants');
      setShowApplicants(false);
    } finally {
      setIsApplicantsLoading(false);
    }
  };

  const startEditJob = (job) => {
    setEditingJobId(job._id);
    setJobForm({
      title: job.title || '',
      company: job.company || job.companyName || '',
      description: job.description || '',
      location: job.location || '',
      type: job.type || 'internship',
      deadline: job.deadline ? new Date(job.deadline).toISOString().slice(0, 10) : '',
    });
    setError('');
    setShowCreateJob(true);
    navigate('/create-job');
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Delete this job posting?')) {
      return;
    }

    try {
      await contentApi.delete(`/api/jobs/${jobId}`);
      setJobs((currentJobs) => currentJobs.filter((job) => job._id !== jobId));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete job');
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / 86400000);

    if (days === 0) {
      return 'Today';
    }
    if (days === 1) {
      return 'Yesterday';
    }
    return `${days}d ago`;
  };

  const filteredJobs = jobs.filter((job) => {
    if (filter === 'applied') {
      return appliedJobs.has(job._id);
    }
    if (filter === 'my-posts') {
      return job.postedBy?._id === user?._id;
    }
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Jobs & Internships
          </h1>
          <p className="text-gray-600">Find opportunities posted by alumni and faculty</p>
        </div>

        {isAlumniOrAdmin && (
          <button
            onClick={() => setShowCreateJob(true)}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-all font-medium whitespace-nowrap"
          >
            + Post Job
          </button>
        )}
      </div>

      {showCreateJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Post a Job Opportunity</h2>
              <button
                onClick={() => {
                  setShowCreateJob(false);
                  setEditingJobId(null);
                  navigate('/jobs');
                }}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="p-6 space-y-4">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Title *
                  </label>
                  <input
                    type="text"
                    value={jobForm.title}
                    onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                    placeholder="e.g., Full-Stack Developer"
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company *
                  </label>
                  <input
                    type="text"
                    value={jobForm.company}
                    onChange={(e) => setJobForm({ ...jobForm, company: e.target.value })}
                    placeholder="Company Name"
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Opportunity Type
                  </label>
                  <select
                    value={jobForm.type}
                    onChange={(e) => setJobForm({ ...jobForm, type: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="internship">Internship</option>
                    <option value="fulltime">Full-Time</option>
                    <option value="parttime">Part-Time</option>
                    <option value="contract">Contract</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={jobForm.location}
                    onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
                    placeholder="City, State"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Application Deadline *
                  </label>
                  <input
                    type="date"
                    value={jobForm.deadline}
                    onChange={(e) => setJobForm({ ...jobForm, deadline: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Description *
                </label>
                <textarea
                  value={jobForm.description}
                  onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                  placeholder="Describe the role, responsibilities, and requirements..."
                  required
                  rows="6"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateJob(false);
                    setEditingJobId(null);
                    navigate('/jobs');
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isLoading ? (editingJobId ? 'Saving...' : 'Posting...') : (editingJobId ? 'Save Changes' : 'Post Job')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showApplyJob && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Apply for Job</h2>
                <p className="text-sm text-gray-600 mt-1">{selectedJob.title} at {selectedJob.company || selectedJob.companyName}</p>
              </div>
              <button
                onClick={() => {
                  setShowApplyJob(false);
                  setSelectedJob(null);
                }}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleApplyJob} className="p-6 space-y-4">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={applicationForm.fullName}
                    onChange={(e) => setApplicationForm({ ...applicationForm, fullName: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={applicationForm.email}
                    onChange={(e) => setApplicationForm({ ...applicationForm, email: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={applicationForm.phone}
                    onChange={(e) => setApplicationForm({ ...applicationForm, phone: e.target.value })}
                    placeholder="Optional contact number"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CV / Resume URL
                  </label>
                  <input
                    type="url"
                    value={applicationForm.resumeUrl}
                    onChange={(e) => setApplicationForm({ ...applicationForm, resumeUrl: e.target.value })}
                    placeholder="https://example.com/resume.pdf"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cover Letter
                </label>
                <textarea
                  value={applicationForm.coverLetter}
                  onChange={(e) => setApplicationForm({ ...applicationForm, coverLetter: e.target.value })}
                  placeholder="Write a short introduction and why you are a good fit..."
                  rows="6"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowApplyJob(false);
                    setSelectedJob(null);
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showApplicants && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Applicants</h2>
                <p className="text-sm text-gray-600 mt-1">{selectedJob.title} at {selectedJob.company || selectedJob.companyName}</p>
              </div>
              <button
                onClick={() => {
                  setShowApplicants(false);
                  setSelectedJob(null);
                  setJobApplicants([]);
                }}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {isApplicantsLoading && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-6 text-gray-600">
                  Loading applicants...
                </div>
              )}

              {!isApplicantsLoading && jobApplicants.length === 0 && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-6 text-gray-600">
                  No applications yet.
                </div>
              )}

              {!isApplicantsLoading && jobApplicants.map((application) => (
                <div key={application._id} className="rounded-lg border border-gray-200 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {application.applicantSnapshot?.name || application.applicant?.name || 'Applicant'}
                      </h3>
                      {application.applicantSnapshot?.headline && (
                        <p className="text-sm text-gray-600">{application.applicantSnapshot.headline}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Applied on {new Date(application.appliedAt || application.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold capitalize text-blue-800">
                      {application.status}
                    </span>
                  </div>

                  {application.resumeUrl && (
                    <div className="mt-4">
                      <a
                        href={application.resumeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-medium text-blue-600 hover:underline"
                      >
                        View CV / Resume
                      </a>
                    </div>
                  )}

                  {application.coverLetter && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Application Details</p>
                      <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-700 whitespace-pre-wrap">
                        {application.coverLetter}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 flex gap-3 border-b border-gray-200">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-3 font-medium border-b-2 transition-all ${
            filter === 'all'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-700 hover:text-gray-900'
          }`}
        >
          All Jobs
        </button>
        <button
          onClick={() => setFilter('applied')}
          className={`px-4 py-3 font-medium border-b-2 transition-all ${
            filter === 'applied'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-700 hover:text-gray-900'
          }`}
        >
          Applied
        </button>
        {isAlumniOrAdmin && (
          <button
            onClick={() => setFilter('my-posts')}
            className={`px-4 py-3 font-medium border-b-2 transition-all ${
              filter === 'my-posts'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-700 hover:text-gray-900'
            }`}
          >
            My Posts
          </button>
        )}
      </div>

      <div className="space-y-4">
        {isJobsLoading && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 text-gray-600">
            Loading jobs...
          </div>
        )}

        {!isJobsLoading && filteredJobs.map((job) => (
          <div
            key={job._id}
            className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-all"
          >
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-start gap-3 mb-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Briefcase size={20} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                      {job.title}
                    </h3>
                    <p className="text-gray-600 font-medium">{job.company || job.companyName}</p>
                  </div>
                </div>

                <p className="text-gray-700 mb-3 line-clamp-2">{job.description}</p>

                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  {job.location && (
                    <div className="flex items-center gap-1">
                      <MapPin size={16} className="text-gray-400" />
                      {job.location}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Clock size={16} className="text-gray-400" />
                    {formatTime(new Date(job.createdAt))}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users size={16} className="text-gray-400" />
                    {job.applicants || job.applicationCount || 0} applicants
                  </div>
                </div>

                <div className="mt-3">
                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full capitalize">
                    {job.type}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 justify-start">
                {job.isOwner || user?.role === 'admin' ? (
                  <div className="relative">
                    <button
                      onClick={() =>
                        setOpenJobMenuId((currentMenuId) =>
                          currentMenuId === job._id ? null : job._id
                        )
                      }
                      className="self-end rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                    >
                      <MoreHorizontal size={18} />
                    </button>

                    {openJobMenuId === job._id && (
                      <div className="absolute right-0 top-full z-10 mt-2 w-40 rounded-lg border border-gray-200 bg-white py-2 shadow-lg">
                        <button
                          onClick={() => {
                            openApplicantsModal(job);
                            setOpenJobMenuId(null);
                          }}
                          className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                        >
                          View Applicants
                        </button>
                        <button
                          onClick={() => {
                            startEditJob(job);
                            setOpenJobMenuId(null);
                          }}
                          className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            handleDeleteJob(job._id);
                            setOpenJobMenuId(null);
                          }}
                          className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                ) : appliedJobs.has(job._id) ? (
                  <button
                    className="px-6 py-2 bg-gray-300 text-gray-700 font-medium rounded-lg whitespace-nowrap"
                  >
                    Applied
                  </button>
                ) : (
                  <button
                    onClick={() => openApplyModal(job)}
                    disabled={user?.role === 'admin' || user?.role === 'alumni'}
                    className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap"
                  >
                    Apply Now
                  </button>
                )}
                {job.deadline && (
                  <p className="text-xs text-gray-500 text-center">
                    Deadline: {new Date(job.deadline).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}

        {!isJobsLoading && filteredJobs.length === 0 && (
          <div className="text-center py-12">
            <Briefcase size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-600 text-lg">No jobs found</p>
          </div>
        )}
      </div>
    </div>
  );
}
