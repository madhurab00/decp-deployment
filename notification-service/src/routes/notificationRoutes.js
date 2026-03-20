const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { asyncHandler } = require('../utils/asyncHandler');
const {
  deleteNotification,
  getNotifications,
  getPreferences,
  markAllAsRead,
  markAsRead,
  updatePreferences
} = require('../controllers/notificationController');

const router = express.Router();

router.use(requireAuth);
router.get('/', asyncHandler(getNotifications));
router.put('/read-all', asyncHandler(markAllAsRead));
router.get('/preferences', asyncHandler(getPreferences));
router.put('/preferences', asyncHandler(updatePreferences));
router.put('/:notificationId/read', asyncHandler(markAsRead));
router.delete('/:notificationId', asyncHandler(deleteNotification));

module.exports = router;
