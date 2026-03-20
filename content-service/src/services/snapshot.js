const buildAuthorSnapshot = (user, fallback = {}) => ({
  name: user.snapshot?.name || fallback.name || 'Unknown User',
  profilePicUrl: user.snapshot?.profilePicUrl || fallback.profilePicUrl || '',
  headline: user.snapshot?.headline || fallback.headline || ''
});

module.exports = {
  buildAuthorSnapshot
};
