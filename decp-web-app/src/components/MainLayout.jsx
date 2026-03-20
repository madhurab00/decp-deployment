import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { chatApi, contentApi, notificationApi } from '../config/api';
import {
  Home,
  Briefcase,
  MessageCircle,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  Plus,
} from 'lucide-react';
import depLogo from '../assets/Dep_logo.png';

export default function MainLayout({ children }) {
  const ACTIVITY_STORAGE_KEY = 'decp_last_seen_activity';
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [activityFlags, setActivityFlags] = useState({
    feed: false,
    jobs: false,
    messages: false,
    notifications: false,
  });
  const [latestActivity, setLatestActivity] = useState({
    feed: null,
    jobs: null,
    messages: null,
    notifications: null,
  });

  const menuItems = [
    { icon: Home, label: 'Feed', path: '/', key: 'feed' },
    { icon: Briefcase, label: 'Jobs', path: '/jobs', key: 'jobs' },
    { icon: MessageCircle, label: 'Messages', path: '/messages', key: 'messages' },
    { icon: Bell, label: 'Notifications', path: '/notifications', key: 'notifications' },
  ];

  const isAlumniOrAdmin = user?.role === 'alumni' || user?.role === 'admin';

  const readStoredActivity = () => {
    try {
      return JSON.parse(localStorage.getItem(ACTIVITY_STORAGE_KEY) || '{}');
    } catch (error) {
      console.error('Failed to parse last seen activity:', error);
      return {};
    }
  };

  const writeStoredActivity = (value) => {
    localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(value));
  };

  useEffect(() => {
    let isMounted = true;

    const updateActivityFlags = async () => {
      try {
        const [feedResponse, jobsResponse, conversationsResponse, notificationsResponse] =
          await Promise.all([
            contentApi.get('/api/posts'),
            contentApi.get('/api/jobs'),
            chatApi.get('/api/conversations'),
            notificationApi.get('/api/notifications', {
              params: { limit: 10 },
            }),
          ]);

        const nextLatestActivity = {
          feed: feedResponse.data.data?.items?.[0]?.createdAt || null,
          jobs: jobsResponse.data.data?.items?.[0]?.createdAt || null,
          messages: conversationsResponse.data.data?.[0]?.lastMessageAt || null,
          notifications:
            notificationsResponse.data.data?.items?.[0]?.timestamp ||
            notificationsResponse.data.data?.items?.[0]?.createdAt ||
            null,
        };

        const storedActivity = readStoredActivity();
        const seededActivity = { ...storedActivity };
        let shouldSeedStorage = false;

        Object.entries(nextLatestActivity).forEach(([key, value]) => {
          if (!seededActivity[key] && value) {
            seededActivity[key] = value;
            shouldSeedStorage = true;
          }
        });

        if (shouldSeedStorage) {
          writeStoredActivity(seededActivity);
        }

        if (!isMounted) return;

        setLatestActivity(nextLatestActivity);
        setActivityFlags({
          feed: Boolean(nextLatestActivity.feed && seededActivity.feed && nextLatestActivity.feed > seededActivity.feed),
          jobs: Boolean(nextLatestActivity.jobs && seededActivity.jobs && nextLatestActivity.jobs > seededActivity.jobs),
          messages: Boolean(
            nextLatestActivity.messages &&
              seededActivity.messages &&
              nextLatestActivity.messages > seededActivity.messages
          ),
          notifications: Boolean(
            nextLatestActivity.notifications &&
              seededActivity.notifications &&
              nextLatestActivity.notifications > seededActivity.notifications
          ),
        });
      } catch (error) {
        console.error('Failed to refresh activity highlights:', error);
      }
    };

    updateActivityFlags();
    const intervalId = setInterval(updateActivityFlags, 30000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    const currentSectionKey =
      location.pathname === '/' || location.pathname === '/create-post'
        ? 'feed'
        : location.pathname === '/jobs' || location.pathname === '/create-job'
          ? 'jobs'
          : location.pathname === '/messages'
            ? 'messages'
            : location.pathname === '/notifications'
              ? 'notifications'
              : null;

    if (!currentSectionKey || !latestActivity[currentSectionKey]) return;

    const storedActivity = readStoredActivity();
    if (storedActivity[currentSectionKey] === latestActivity[currentSectionKey]) {
      setActivityFlags((currentFlags) => ({ ...currentFlags, [currentSectionKey]: false }));
      return;
    }

    storedActivity[currentSectionKey] = latestActivity[currentSectionKey];
    writeStoredActivity(storedActivity);
    setActivityFlags((currentFlags) => ({ ...currentFlags, [currentSectionKey]: false }));
  }, [location.pathname, latestActivity]);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 transition-all duration-300 fixed h-full left-0 top-0 z-40 flex flex-col`}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-2 cursor-pointer hover:opacity-80" onClick={() => navigate('/')}>
            <img
              src={depLogo}
              alt="Department Logo"
              className={`${sidebarOpen ? 'h-18' : 'h-10'} w-auto object-contain`}
            />
          </div>
        </div>
       

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map(({ icon: Icon, label, path, key }) => {
            const isActive = location.pathname === path;
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="relative flex-shrink-0">
                  <Icon size={24} />
                  {activityFlags[key] && (
                    <span className="absolute -right-1 -top-1 block h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
                  )}
                </div>
                {sidebarOpen && (
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="font-medium">{label}</span>
                    {activityFlags[key] && (
                      <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-600">
                        New
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Post Button */}
        <div className="p-4 border-t border-gray-200">
          {isAlumniOrAdmin && (
            <button
              onClick={() => navigate('/create-job')}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              {sidebarOpen && 'Post Job'}
            </button>
          )}
          <button
            onClick={() => navigate('/create-post')}
            className={`w-full mt-2 ${isAlumniOrAdmin ? '' : ''} bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all flex items-center justify-center gap-2`}
          >
            <Plus size={20} />
            {sidebarOpen && 'Post'}
          </button>
        </div>

        {/* Collapse Button */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center justify-center p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
        {/* Top Navigation */}
        <div className="sticky top-0 bg-white border-b border-gray-200 z-30">
          <div className="px-6 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              {location.pathname === '/' && 'Feed'}
              {location.pathname === '/jobs' && 'Jobs & Internships'}
              {location.pathname === '/messages' && 'Messages'}
              {location.pathname === '/notifications' && 'Notifications'}
              {location.pathname === '/profile' && 'Profile'}
            </h1>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-100 transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm overflow-hidden">
                  {user?.profilePicUrl ? (
                    <img
                      src={user.profilePicUrl}
                      alt={user?.fullName || 'User'}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    user?.fullName?.charAt(0) || 'U'
                  )}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-semibold text-gray-900">{user?.fullName}</p>
                  <p className="text-xs text-gray-600 capitalize">{user?.role}</p>
                </div>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <button
                    onClick={() => {
                      navigate('/profile');
                      setUserMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-t-lg"
                  >
                    <User size={18} />
                    <span>View Profile</span>
                  </button>
                  <button
                    onClick={() => {
                      logout();
                      navigate('/login');
                      setUserMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-b-lg border-t border-gray-200"
                  >
                    <LogOut size={18} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="overflow-auto h-[calc(100vh-73px)]">
          {children}
        </div>
      </div>
    </div>
  );
}
