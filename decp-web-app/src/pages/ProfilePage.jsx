import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userApi } from '../config/api';
import {
  Mail,
  MapPin,
  Briefcase,
  Calendar,
  Edit2,
  Camera,
  Loader,
  Trash2,
  Link as LinkIcon,
} from 'lucide-react';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    bio: user?.bio || '',
    location: user?.location || '',
    role: user?.role || '',
    headline: user?.headline || '',
    profilePicUrl: user?.profilePicUrl || '',
    coverPicUrl: user?.coverPicUrl || '',
    batchYear: user?.batchYear || '',
    graduationYear: user?.graduationYear || '',
    skillsText: Array.isArray(user?.skills) ? user.skills.join(', ') : '',
    linksText: Array.isArray(user?.links) ? user.links.join(', ') : '',
  });

  useEffect(() => {
    setFormData({
      fullName: user?.fullName || '',
      email: user?.email || '',
      bio: user?.bio || '',
      location: user?.location || '',
      role: user?.role || '',
      headline: user?.headline || '',
      profilePicUrl: user?.profilePicUrl || '',
      coverPicUrl: user?.coverPicUrl || '',
      batchYear: user?.batchYear || '',
      graduationYear: user?.graduationYear || '',
      skillsText: Array.isArray(user?.skills) ? user.skills.join(', ') : '',
      linksText: Array.isArray(user?.links) ? user.links.join(', ') : '',
    });
  }, [user]);

  const parseCommaSeparatedValues = (value) =>
    value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      setFormData((prev) => ({
        ...prev,
        profilePicUrl: loadEvent.target.result,
      }));
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');

    try {
      const payload = {
        fullName: formData.fullName,
        bio: formData.bio,
        location: formData.location,
        headline: formData.headline,
        profilePicUrl: formData.profilePicUrl,
        coverPicUrl: formData.coverPicUrl,
        batchYear: formData.batchYear ? Number(formData.batchYear) : null,
        graduationYear: formData.graduationYear ? Number(formData.graduationYear) : null,
        skills: parseCommaSeparatedValues(formData.skillsText),
        links: parseCommaSeparatedValues(formData.linksText),
      };

      const response = await userApi.put('/profile', payload);
      updateUser({
        ...user,
        ...response.data,
      });
      setIsEditing(false);
    } catch (saveError) {
      console.error('Error updating profile:', saveError);
      setError(saveError.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Delete your account permanently? This action cannot be undone.'
    );

    if (!confirmed) return;

    setIsDeleting(true);
    setError('');

    try {
      await userApi.delete('/profile');
      logout();
      navigate('/login');
    } catch (deleteError) {
      console.error('Error deleting account:', deleteError);
      setError(deleteError.response?.data?.message || 'Failed to delete account');
      setIsDeleting(false);
    }
  };

  const renderAvatar = (sizeClasses, textClasses) => {
    if (formData.profilePicUrl || user?.profilePicUrl) {
      return (
        <img
          src={formData.profilePicUrl || user?.profilePicUrl}
          alt={user?.fullName || 'User'}
          className={`${sizeClasses} rounded-full border-4 border-white shadow-lg object-cover`}
        />
      );
    }

    return (
      <div
        className={`${sizeClasses} rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white border-4 border-white shadow-lg flex-shrink-0 ${textClasses}`}
      >
        {user?.fullName?.charAt(0)}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div
          className="h-32 bg-gradient-to-r from-blue-600 to-purple-600 bg-cover bg-center"
          style={formData.coverPicUrl ? { backgroundImage: `url(${formData.coverPicUrl})` } : undefined}
        />

        <div className="relative px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-16 relative z-10">
            <div className="flex items-end gap-4">
              <div className="relative">
                {renderAvatar('w-32 h-32', 'font-bold text-4xl')}
                {isEditing && (
                  <label className="absolute bottom-2 right-2 inline-flex cursor-pointer items-center justify-center rounded-full bg-white p-2 text-gray-700 shadow-md hover:bg-gray-100">
                    <Camera size={18} />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfileImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              <div className="mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{formData.fullName || user?.fullName}</h1>
                <p className="text-gray-600 capitalize text-lg">{user?.role}</p>
                {formData.headline && <p className="text-sm text-gray-500 mt-1">{formData.headline}</p>}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsEditing((currentState) => !currentState);
                  setError('');
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all font-medium flex items-center gap-2 whitespace-nowrap"
              >
                <Edit2 size={18} />
                Edit Profile
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="px-6 py-2 border border-red-300 rounded-lg text-red-600 hover:bg-red-50 transition-all font-medium flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
              >
                {isDeleting ? <Loader size={18} className="animate-spin" /> : <Trash2 size={18} />}
                Delete Account
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 text-gray-700">
              <Mail size={20} className="text-gray-400" />
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Email</p>
                <p className="font-medium truncate">{user?.email}</p>
              </div>
            </div>

            {formData.location && (
              <div className="flex items-center gap-3 text-gray-700">
                <MapPin size={20} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Location</p>
                  <p className="font-medium">{formData.location}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 text-gray-700">
              <Briefcase size={20} className="text-gray-400" />
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Role</p>
                <p className="font-medium capitalize">{user?.role}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-gray-700">
              <Calendar size={20} className="text-gray-400" />
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Joined</p>
                <p className="font-medium">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Recently'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isEditing && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Edit Profile</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Headline</label>
              <input
                type="text"
                name="headline"
                value={formData.headline}
                onChange={handleChange}
                placeholder="Software Engineer | Alumni Mentor"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="City, Country"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cover Photo URL</label>
              <input
                type="text"
                name="coverPicUrl"
                value={formData.coverPicUrl}
                onChange={handleChange}
                placeholder="https://..."
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Batch Year</label>
              <input
                type="number"
                name="batchYear"
                value={formData.batchYear}
                onChange={handleChange}
                placeholder="2022"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Graduation Year</label>
              <input
                type="number"
                name="graduationYear"
                value={formData.graduationYear}
                onChange={handleChange}
                placeholder="2026"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Tell us about yourself..."
                rows="4"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
              <input
                type="text"
                name="skillsText"
                value={formData.skillsText}
                onChange={handleChange}
                placeholder="Node.js, React, MongoDB"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
              <p className="mt-1 text-xs text-gray-500">Separate multiple skills with commas.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <LinkIcon size={14} />
                Links
              </label>
              <input
                type="text"
                name="linksText"
                value={formData.linksText}
                onChange={handleChange}
                placeholder="https://linkedin.com/in/..., https://github.com/..."
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
              <p className="mt-1 text-xs text-gray-500">Separate multiple links with commas.</p>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 mt-6">
            <button
              onClick={() => setIsEditing(false)}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all font-medium inline-flex items-center gap-2"
            >
              {isSaving && <Loader size={18} className="animate-spin" />}
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { label: 'Posts', count: '12' },
          { label: 'Followers', count: '248' },
          { label: 'Following', count: '156' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <p className="text-3xl font-bold text-blue-600 mb-2">{stat.count}</p>
            <p className="text-gray-600 font-medium">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
