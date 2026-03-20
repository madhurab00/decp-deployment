import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MainLayout from '../components/MainLayout';
import { contentApi } from '../config/api';
import { ArrowLeft, Image, Smile, Loader } from 'lucide-react';

export default function CreatePostPage() {
  const emojiOptions = [
    '\u{1F600}',
    '\u{1F389}',
    '\u{1F525}',
    '\u{1F44F}',
    '\u{1F4BC}',
    '\u{1F680}',
    '\u{2764}\u{FE0F}',
    '\u{1F64C}',
  ];
  const navigate = useNavigate();
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const currentUserSnapshot = {
    name: user?.fullName || 'Unknown User',
    profilePicUrl: user?.profilePicUrl || '',
    headline: user?.headline || '',
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImages((prev) => [...prev, event.target.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;

    setIsLoading(true);
    setError('');
    try {
      await contentApi.post('/api/posts', {
        text: content,
        media: images.map((url) => ({ url, type: 'image' })),
        snapshot: currentUserSnapshot,
      });
      navigate('/');
    } catch (submitError) {
      console.error('Error creating post:', submitError);
      setError(submitError.response?.data?.message || 'Failed to create post');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmojiInsert = (emoji) => {
    setContent((currentContent) => `${currentContent}${emoji}`);
    setShowEmojiPicker(false);
  };

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto p-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-blue-600 hover:underline mb-6"
        >
          <ArrowLeft size={20} />
          Back to Feed
        </button>

        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-6 text-gray-900">Create a Post</h1>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 overflow-hidden">
              {user?.profilePicUrl ? (
                <img
                  src={user.profilePicUrl}
                  alt={user?.fullName || 'User'}
                  className="h-full w-full object-cover"
                />
              ) : (
                user?.fullName?.charAt(0)
              )}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{user?.fullName}</p>
              <p className="text-sm text-gray-600 capitalize">{user?.role}</p>
            </div>
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full border border-gray-300 rounded-lg p-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none mb-4"
            rows="8"
          />

          {images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {images.map((img, idx) => (
                <div key={idx} className="relative group">
                  <img
                    src={img}
                    alt={`preview-${idx}`}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => setImages(images.filter((_, i) => i !== idx))}
                    className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3 border-t border-gray-200 pt-4">
            <label className="flex items-center gap-2 flex-1 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer transition-all">
              <Image size={20} />
              <span className="hidden sm:inline">Add Photo</span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
            <div className="relative flex-1">
              <button
                type="button"
                onClick={() => setShowEmojiPicker((currentState) => !currentState)}
                className="flex w-full items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
              >
                <Smile size={20} />
                <span className="hidden sm:inline">Emoji</span>
              </button>

              {showEmojiPicker && (
                <div className="absolute right-0 top-full z-10 mt-2 flex gap-2 rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
                  {emojiOptions.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleEmojiInsert(emoji)}
                      className="text-xl transition-transform hover:scale-110"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 mt-4">
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!content.trim() || isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center gap-2"
            >
              {isLoading && <Loader size={18} className="animate-spin" />}
              {isLoading ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
