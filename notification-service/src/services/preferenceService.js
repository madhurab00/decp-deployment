const NotificationPreference = require('../models/NotificationPreference');

const TYPE_GROUPS = {
  POST_LIKED: 'likesNotifications',
  COMMENT_ADDED: 'commentsNotifications',
  JOB_APPLIED: 'jobNotifications',
  JOB_POSTED: 'jobNotifications',
  MESSAGE_RECEIVED: 'messageNotifications'
};

const PREF_TO_MUTED_TYPES = {
  likesNotifications: 'POST_LIKED',
  commentsNotifications: 'COMMENT_ADDED',
  jobNotifications: 'JOB_APPLIED',
  messageNotifications: 'MESSAGE_RECEIVED'
};

const DEFAULT_PREFERENCES = {
  likesNotifications: true,
  commentsNotifications: true,
  jobNotifications: true,
  messageNotifications: true
};

const buildPreferenceResponse = (preference) => {
  const mutedTypes = preference?.mutedTypes || [];

  return {
    likesNotifications: !mutedTypes.includes('POST_LIKED'),
    commentsNotifications: !mutedTypes.includes('COMMENT_ADDED'),
    jobNotifications: !mutedTypes.includes('JOB_APPLIED') && !mutedTypes.includes('JOB_POSTED'),
    messageNotifications: !mutedTypes.includes('MESSAGE_RECEIVED')
  };
};

const getOrCreatePreference = async (userId) => {
  let preference = await NotificationPreference.findOne({ userId });

  if (!preference) {
    preference = await NotificationPreference.create({
      userId,
      channels: {
        inApp: true,
        push: true,
        email: true
      },
      mutedTypes: []
    });
  }

  return preference;
};

const canSendInAppNotification = async (userId, type) => {
  const preference = await getOrCreatePreference(userId);

  if (preference.channels?.inApp === false) {
    return false;
  }

  return !preference.mutedTypes.includes(type);
};

const savePreferenceSettings = async (userId, updates) => {
  const preference = await getOrCreatePreference(userId);

  const mutedTypes = new Set(preference.mutedTypes || []);

  Object.entries(updates).forEach(([key, enabled]) => {
    const mappedType = PREF_TO_MUTED_TYPES[key];
    if (!mappedType) {
      return;
    }

    if (enabled) {
      mutedTypes.delete(mappedType);
      if (mappedType === 'JOB_APPLIED') {
        mutedTypes.delete('JOB_POSTED');
      }
    } else {
      mutedTypes.add(mappedType);
      if (mappedType === 'JOB_APPLIED') {
        mutedTypes.add('JOB_POSTED');
      }
    }
  });

  preference.mutedTypes = Array.from(mutedTypes);
  await preference.save();

  return buildPreferenceResponse(preference);
};

const getUsersEligibleForType = async (type, excludedUserIds = []) => {
  const preferences = await NotificationPreference.find({
    userId: { $nin: excludedUserIds },
    'channels.inApp': true,
    mutedTypes: { $ne: type }
  }).lean();

  return preferences.map((preference) => preference.userId.toString());
};

module.exports = {
  DEFAULT_PREFERENCES,
  TYPE_GROUPS,
  buildPreferenceResponse,
  canSendInAppNotification,
  getUsersEligibleForType,
  getOrCreatePreference,
  savePreferenceSettings
};
