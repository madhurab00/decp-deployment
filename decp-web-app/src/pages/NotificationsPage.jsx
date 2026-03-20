import { useEffect, useState } from 'react';
import {
  Briefcase,
  Heart,
  MessageCircle,
  Settings,
  Trash2,
  User,
} from 'lucide-react';
import { notificationApi } from '../config/api';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [preferences, setPreferences] = useState({
    likesNotifications: true,
    commentsNotifications: true,
    jobNotifications: true,
    messageNotifications: true,
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        setIsLoading(true);
        setError('');
        const [notificationsResponse, preferencesResponse] = await Promise.all([
          notificationApi.get('/api/notifications'),
          notificationApi.get('/api/notifications/preferences')
        ]);

        setNotifications(notificationsResponse.data.data.items || []);
        setPreferences(preferencesResponse.data.data);
      } catch (err) {
        console.error('Failed to load notifications:', err);
        setError(err.response?.data?.message || 'Failed to load notifications');
      } finally {
        setIsLoading(false);
      }
    };

    loadNotifications();
  }, []);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return <Heart size={20} className="text-red-600" />;
      case 'comment':
        return <MessageCircle size={20} className="text-blue-600" />;
      case 'job':
      case 'job_application':
        return <Briefcase size={20} className="text-green-600" />;
      case 'message':
        return <MessageCircle size={20} className="text-purple-600" />;
      case 'follow':
        return <User size={20} className="text-blue-600" />;
      default:
        return <MessageCircle size={20} className="text-gray-600" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'like':
        return 'bg-red-50';
      case 'comment':
        return 'bg-blue-50';
      case 'job':
      case 'job_application':
        return 'bg-green-50';
      case 'message':
        return 'bg-purple-50';
      default:
        return 'bg-gray-50';
    }
  };

  const markAsRead = async (id) => {
    try {
      await notificationApi.put(`/api/notifications/${id}/read`);
      setNotifications((currentNotifications) =>
        currentNotifications.map((notification) =>
          notification.id === id ? { ...notification, read: true, isRead: true } : notification
        )
      );
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationApi.put('/api/notifications/read-all');
      setNotifications((currentNotifications) =>
        currentNotifications.map((notification) => ({ ...notification, read: true, isRead: true }))
      );
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await notificationApi.delete(`/api/notifications/${id}`);
      setNotifications((currentNotifications) =>
        currentNotifications.filter((notification) => notification.id !== id)
      );
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const savePreferences = async () => {
    try {
      setIsSavingPreferences(true);
      await notificationApi.put('/api/notifications/preferences', preferences);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save preferences');
    } finally {
      setIsSavingPreferences(false);
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'yesterday';
    return `${days}d ago`;
  };

  const filteredNotifications = notifications.filter((notification) => {
    if (filter === 'unread') return !notification.read;
    if (filter === 'likes') return notification.type === 'like';
    if (filter === 'comments') return notification.type === 'comment';
    if (filter === 'jobs') return notification.type === 'job' || notification.type === 'job_application';
    return true;
  });

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="sticky top-0 bg-white border-b border-gray-200 z-30">
        <div className="p-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                {unreadCount} unread
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all font-medium text-sm"
              >
                Mark all as read
              </button>
            )}
          </div>
        </div>

        <div className="px-6 border-t border-gray-200 flex gap-4 overflow-x-auto">
          {[
            { id: 'all', label: 'All' },
            { id: 'unread', label: 'Unread' },
            { id: 'likes', label: 'Likes' },
            { id: 'comments', label: 'Comments' },
            { id: 'jobs', label: 'Jobs' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-4 py-4 border-b-2 font-medium transition-all whitespace-nowrap ${
                filter === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-700 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="m-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="divide-y divide-gray-200">
        {isLoading ? (
          <div className="p-12 text-center text-gray-600">Loading notifications...</div>
        ) : filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => markAsRead(notification.id)}
              className={`p-6 hover:bg-gray-50 cursor-pointer transition-all ${
                !notification.read ? 'bg-blue-50 hover:bg-blue-100' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${getNotificationColor(notification.type)}`}>
                  {getNotificationIcon(notification.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-gray-900">
                    {notification.actor?.fullName && (
                      <span className="font-semibold">{notification.actor.fullName} </span>
                    )}
                    <span className="text-gray-700">{notification.message}</span>
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatTime(new Date(notification.timestamp))}
                  </p>
                </div>

                {!notification.read && (
                  <div className="w-3 h-3 rounded-full bg-blue-600 flex-shrink-0 mt-1.5" />
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(notification.id);
                  }}
                  className="p-2 hover:bg-gray-200 rounded-full transition-all text-gray-600 flex-shrink-0"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 text-center">
            <MessageCircle size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-600 text-lg">No notifications</p>
            <p className="text-gray-500 text-sm mt-1">
              You&apos;re all caught up! Stay active to get new notifications.
            </p>
          </div>
        )}
      </div>

      <div className="m-6 bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <Settings size={24} className="text-gray-700" />
          <h2 className="text-lg font-bold text-gray-900">Notification Preferences</h2>
        </div>

        <div className="space-y-4">
          {[
            {
              id: 'likesNotifications',
              label: 'Post Likes',
              description: 'Get notified when someone likes your post',
            },
            {
              id: 'commentsNotifications',
              label: 'Comments',
              description: 'Get notified when someone comments on your post',
            },
            {
              id: 'jobNotifications',
              label: 'Job Updates',
              description: 'Get notified about job activity related to you',
            },
            {
              id: 'messageNotifications',
              label: 'Messages',
              description: 'Get notified when you receive a new message',
            },
          ].map((preference) => (
            <div key={preference.id} className="flex items-center justify-between py-3 border-t border-gray-200">
              <div>
                <p className="font-medium text-gray-900">{preference.label}</p>
                <p className="text-sm text-gray-600">{preference.description}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences[preference.id]}
                  onChange={(e) =>
                    setPreferences((currentPreferences) => ({
                      ...currentPreferences,
                      [preference.id]: e.target.checked,
                    }))
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>

        <button
          onClick={savePreferences}
          disabled={isSavingPreferences}
          className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all font-medium"
        >
          {isSavingPreferences ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
}
