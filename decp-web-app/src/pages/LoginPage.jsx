import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ChevronRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../config/api';
import depLogo from '../assets/Dep_logo.png';
import careerImage from '../assets/Career.png';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [selectedRole, setSelectedRole] = useState('student');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    confirmPassword: '',
  });

  const roles = [
    { id: 'student', label: 'Student', icon: '👨‍🎓', color: 'from-blue-500 to-blue-600' },
    { id: 'alumni', label: 'Alumni', icon: '🎯', color: 'from-purple-500 to-purple-600' },
    { id: 'admin', label: 'Admin', icon: '⚙️', color: 'from-orange-500 to-orange-600' },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await authApi.post('/login', {
        email: formData.email,
        password: formData.password,
      });

      // Based on typical express JSON responses
      const { user, token } = response.data.data;
      if (token && user) {
        login(user, token);
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authApi.post('/register', {
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        role: selectedRole,
      });

      const { user, token } = response.data.data;
      if (token && user) {
        login(user, token);
        navigate('/');
      } else {
        // Fallback if the backend doesn't return a token on register, force them to login
        setIsLogin(true);
        setError('Registration successful! Please sign in.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="fixed top-0 w-full bg-white shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center">
            <img
            src={depLogo}
            alt="Department Logo"
            className="h-16 w-auto object-contain"
          />
          </div>
          <p className="text-gray-600 text-sm">Department Engagement & Career Platform</p>
        </div>
      </div>

      <div className="flex min-h-screen pt-24">
        {/* Left Side - Brand */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-purple-700 p-12 flex-col justify-center text-white">
          <div className="mb-8">
            <h1 className="text-5xl font-bold mb-4">Department Engagement & Career Platform</h1>
            <p className="text-xl text-blue-100 mb-8">
              Joining students and alumni to share opportunities, collaborate on research, and build career.
            </p>
          </div>

          <div className="flex justify-center">
            <img
              src={careerImage}
              alt="Career Opportunities"
              className="max-w-full h-auto rounded-lg shadow-lg"
            />
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8">
          <div className="w-full max-w-md">
            {/* Role Selection (Register Only) */}
            {!isLogin && (
              <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-700 mb-4">
                  Select Your Role
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {roles.map(role => (
                    <button
                      key={role.id}
                      onClick={() => setSelectedRole(role.id)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        selectedRole === role.id
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="text-2xl mb-2">{role.icon}</div>
                      <div className="text-sm font-medium text-gray-900">{role.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Form Container */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {isLogin ? 'Welcome Back' : 'Join DECP'}
              </h2>
              <p className="text-gray-600 mb-8">
                {isLogin
                  ? 'Sign in to access your department platform'
                  : 'Create an account to get started'}
              </p>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={isLogin ? handleLogin : handleRegister} className="space-y-4">
                {/* Full Name (Register Only) */}
                {!isLogin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 text-gray-400" size={20} />
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        placeholder="John Doe"
                        required={!isLogin}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                {/* Confirm Password (Register Only) */}
                {!isLogin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="••••••••"
                        required={!isLogin}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                >
                  {isLoading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
                </button>
              </form>

              {/* Toggle */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-gray-600 text-center">
                  {isLogin ? "Don't have an account? " : 'Already have an account? '}
                  <button
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setError('');
                      setFormData({ email: '', password: '', fullName: '', confirmPassword: '' });
                    }}
                    className="text-blue-600 font-semibold hover:underline"
                  >
                    {isLogin ? 'Sign Up' : 'Sign In'}
                  </button>
                </p>
            </div>
            {/* End Form Container */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
