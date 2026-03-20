const Notification = require('../models/Notification');
const { parsePagination } = require('../utils/pagination');
const { createHttpError, sendSuccess } = require('../utils/response');
const {
  buildPreferenceResponse,
  getOrCreatePreference,
  savePreferenceSettings
} = require('../services/preferenceService');

const TYPE_TO_FRONTEND = {
  POST_LIKED: 'like',
  COMMENT_ADDED: 'comment',
  JOB_APPLIED: 'job_application',
  JOB_POSTED: 'job',
  MESSAGE_RECEIVED: 'message',
  CONNECTION_REQUEST: 'follow'
};

const mapNotification = (notification) => ({
  id: notification._id,
  _id: notification._id,
  type: TYPE_TO_FRONTEND[notification.type] || notification.type,
  message: notification.body,
  title: notification.title,
  actor: notification.data?.actorName
    ? {
        _id: notification.data?.actorId || '',
        fullName: notification.data.actorName
      }
    : null,
  targetType: notification.data?.targetType || '',
  targetId: notification.data?.targetId || '',
  read: notification.isRead,
  isRead: notification.isRead,
  timestamp: notification.createdAt,
  createdAt: notification.createdAt
});

const getNotifications = async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);

  const [notifications, total] = await Promise.all([
    Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Notification.countDocuments({ userId: req.user.id })
  ]);

  return sendSuccess(
    res,
    200,
    {
      items: notifications.map(mapNotification),
      page,
      limit,
      total
    },
    'Notifications fetched successfully'
  );
};

const markAsRead = async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.notificationId, userId: req.user.id },
    { isRead: true, readAt: new Date() },
    { new: true }
  );

  if (!notification) {
    throw createHttpError(404, 'Notification not found');
  }

  return sendSuccess(res, 200, mapNotification(notification), 'Notification marked as read');
};

const markAllAsRead = async (req, res) => {
  await Notification.updateMany(
    { userId: req.user.id, isRead: false },
    { isRead: true, readAt: new Date() }
  );

  return sendSuccess(res, 200, null, 'All notifications marked as read');
};

const deleteNotification = async (req, res) => {
  const notification = await Notification.findOneAndDelete({
    _id: req.params.notificationId,
    userId: req.user.id
  });

  if (!notification) {
    throw createHttpError(404, 'Notification not found');
  }

  return sendSuccess(res, 200, null, 'Notification deleted');
};

const getPreferences = async (req, res) => {
  const preference = await getOrCreatePreference(req.user.id);
  return sendSuccess(
    res,
    200,
    buildPreferenceResponse(preference),
    'Notification preferences fetched successfully'
  );
};

const updatePreferences = async (req, res) => {
  const preferenceResponse = await savePreferenceSettings(req.user.id, req.body);
  return sendSuccess(
    res,
    200,
    preferenceResponse,
    'Notification preferences updated successfully'
  );
};

module.exports = {
  deleteNotification,
  getNotifications,
  getPreferences,
  markAllAsRead,
  markAsRead,
  updatePreferences
};
