import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { chatApi, userApi } from '../config/api';
import {
  Send,
  Phone,
  Video,
  MoreVertical,
  Search,
  MessageSquarePlus,
  Loader,
  X,
  Trash2,
} from 'lucide-react';

export default function MessagesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [pageError, setPageError] = useState('');
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showConversationMenu, setShowConversationMenu] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userResults, setUserResults] = useState([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const messagesEndRef = useRef(null);

  const selectedConversation =
    conversations.find((conversation) => conversation._id === selectedConversationId) || null;

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (!selectedConversationId) {
      setMessages([]);
      setShowConversationMenu(false);
      return;
    }

    loadMessages(selectedConversationId);
  }, [selectedConversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!showNewChatModal) {
      setUserSearchQuery('');
      setUserResults([]);
      return;
    }

    const trimmedQuery = userSearchQuery.trim();
    if (!trimmedQuery) {
      setUserResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearchingUsers(true);
      try {
        const response = await userApi.get('/', {
          params: {
            search: trimmedQuery,
            limit: 8,
          },
        });

        const users = response.data.users || [];
        setUserResults(users.filter((resultUser) => resultUser._id !== user?._id));
      } catch (error) {
        console.error('Failed to search users:', error);
        setUserResults([]);
      } finally {
        setIsSearchingUsers(false);
      }
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [showNewChatModal, userSearchQuery, user?._id]);

  const loadConversations = async () => {
    setIsLoadingConversations(true);
    setPageError('');

    try {
      const response = await chatApi.get('/api/conversations');
      const items = response.data.data || [];
      setConversations(items);
      setSelectedConversationId((currentSelectedId) => {
        if (currentSelectedId && items.some((item) => item._id === currentSelectedId)) {
          return currentSelectedId;
        }

        return items[0]?._id || null;
      });
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      setPageError(error.response?.data?.message || 'Failed to load conversations');
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const loadMessages = async (conversationId) => {
    setIsLoadingMessages(true);
    setPageError('');

    try {
      const response = await chatApi.get(`/api/conversations/${conversationId}/messages`);
      setMessages(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      setPageError(error.response?.data?.message || 'Failed to load messages');
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleStartConversation = async (targetUser) => {
    try {
      const response = await chatApi.post('/api/conversations/direct', {
        recipientId: targetUser._id,
        recipientSnapshot: {
          fullName: targetUser.fullName,
          role: targetUser.role,
          headline: targetUser.headline,
          profilePicUrl: targetUser.profilePicUrl,
        },
      });

      const conversation = response.data.data;
      setConversations((currentConversations) => {
        const existingConversation = currentConversations.find(
          (item) => item._id === conversation._id
        );

        if (existingConversation) {
          return currentConversations.map((item) =>
            item._id === conversation._id ? conversation : item
          );
        }

        return [conversation, ...currentConversations];
      });
      setSelectedConversationId(conversation._id);
      setShowNewChatModal(false);
    } catch (error) {
      console.error('Failed to start conversation:', error);
      setPageError(error.response?.data?.message || 'Failed to start conversation');
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversationId || isSending) return;

    setIsSending(true);
    const trimmedMessage = messageInput.trim();

    try {
      const response = await chatApi.post(`/api/conversations/${selectedConversationId}/messages`, {
        text: trimmedMessage,
      });

      const savedMessage = response.data.data;
      setMessages((currentMessages) => [...currentMessages, savedMessage]);
      setMessageInput('');

      setConversations((currentConversations) =>
        currentConversations
          .map((conversation) =>
            conversation._id === selectedConversationId
              ? {
                  ...conversation,
                  lastMessage: {
                    _id: savedMessage._id,
                    text: savedMessage.text,
                    senderId: savedMessage.senderId,
                    createdAt: savedMessage.createdAt,
                  },
                  lastMessageAt: savedMessage.createdAt,
                }
              : conversation
          )
          .sort(
            (firstConversation, secondConversation) =>
              new Date(secondConversation.lastMessageAt || 0) -
              new Date(firstConversation.lastMessageAt || 0)
          )
      );
    } catch (error) {
      console.error('Failed to send message:', error);
      setPageError(error.response?.data?.message || 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteConversation = async () => {
    if (!selectedConversationId || !selectedConversation) return;

    const confirmed = window.confirm(
      `Delete your chat with ${getConversationName(selectedConversation)}? This will remove all messages in this conversation.`
    );

    if (!confirmed) return;

    try {
      await chatApi.delete(`/api/conversations/${selectedConversationId}`);

      const remainingConversations = conversations.filter(
        (conversation) => conversation._id !== selectedConversationId
      );

      setConversations(remainingConversations);
      setSelectedConversationId(remainingConversations[0]?._id || null);
      setMessages([]);
      setShowConversationMenu(false);
      setPageError('');
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      setPageError(error.response?.data?.message || 'Failed to delete conversation');
    }
  };

  const filteredConversations = conversations.filter((conversation) => {
    const displayName = conversation.otherMember?.fullName || conversation.title || 'Conversation';
    return displayName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const formatTime = (value) => {
    if (!value) return '';

    const date = new Date(value);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days === 1) return 'yesterday';
    return `${days}d`;
  };

  const getConversationName = (conversation) =>
    conversation.otherMember?.fullName || conversation.title || 'Conversation';

  const getConversationRole = (conversation) =>
    conversation.otherMember?.role || 'member';

  const getInitial = (value) => value?.charAt(0)?.toUpperCase() || '?';

  return (
    <div className="flex h-[calc(100vh-73px)] bg-gray-50 max-w-7xl mx-auto">
      <div className="hidden md:flex md:w-80 bg-white border-r border-gray-200 flex-col">
        <div className="p-4 border-b border-gray-200 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-gray-900">Messages</h2>
            <button
              type="button"
              onClick={() => setShowNewChatModal(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-all"
            >
              <MessageSquarePlus size={16} />
              New Chat
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoadingConversations ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <Loader className="animate-spin" size={20} />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-6 text-sm text-gray-500">
              No conversations yet. Start a new chat to begin messaging.
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <button
                key={conversation._id}
                onClick={() => setSelectedConversationId(conversation._id)}
                className={`w-full p-4 border-b border-gray-100 text-left hover:bg-gray-50 transition-all ${
                  selectedConversationId === conversation._id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 overflow-hidden">
                    {conversation.otherMember?.profilePicUrl ? (
                      <img
                        src={conversation.otherMember.profilePicUrl}
                        alt={getConversationName(conversation)}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      getInitial(getConversationName(conversation))
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <p className="font-semibold text-gray-900 truncate">
                        {getConversationName(conversation)}
                      </p>
                      <span className="text-xs text-gray-500 shrink-0">
                        {formatTime(conversation.lastMessageAt)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 capitalize mb-1">
                      {getConversationRole(conversation)}
                    </p>
                    <p className="text-sm text-gray-600 truncate">
                      {conversation.lastMessage?.text || 'No messages yet'}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {selectedConversation ? (
        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full md:w-auto">
          <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm overflow-hidden">
                {selectedConversation.otherMember?.profilePicUrl ? (
                  <img
                    src={selectedConversation.otherMember.profilePicUrl}
                    alt={getConversationName(selectedConversation)}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  getInitial(getConversationName(selectedConversation))
                )}
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  {getConversationName(selectedConversation)}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {getConversationRole(selectedConversation)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-gray-100 rounded-full transition-all">
                <Phone size={20} className="text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-full transition-all">
                <Video size={20} className="text-gray-600" />
              </button>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowConversationMenu((currentState) => !currentState)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-all"
                >
                  <MoreVertical size={20} className="text-gray-600" />
                </button>

                {showConversationMenu && (
                  <div className="absolute right-0 top-full z-10 mt-2 w-44 rounded-lg border border-gray-200 bg-white py-2 shadow-lg">
                    <button
                      type="button"
                      onClick={handleDeleteConversation}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={16} />
                      Delete chat
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {pageError && (
            <div className="mx-4 mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {pageError}
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {isLoadingMessages ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <Loader className="animate-spin" size={20} />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                No messages yet. Send the first one.
              </div>
            ) : (
              messages.map((message) => {
                const isOwnMessage = String(message.senderId) === String(user?._id);
                return (
                  <div
                    key={message._id}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isOwnMessage && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mr-3">
                        {getInitial(getConversationName(selectedConversation))}
                      </div>
                    )}
                    <div className="max-w-xs lg:max-w-md">
                      <div
                        className={`px-4 py-2 rounded-lg ${
                          isOwnMessage
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-900'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                      </div>
                      <p
                        className={`text-xs mt-1 ${
                          isOwnMessage ? 'text-right' : 'text-left'
                        } text-gray-500`}
                      >
                        {new Date(message.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="bg-white border-t border-gray-200 p-4">
            <div className="flex gap-3">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendMessage();
                }}
                placeholder="Type a message..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
              <button
                onClick={handleSendMessage}
                disabled={!messageInput.trim() || isSending}
                className="px-4 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isSending ? <Loader size={20} className="animate-spin" /> : <Send size={20} />}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-gray-500">
          <p>Select a conversation to start messaging</p>
          <button
            type="button"
            onClick={() => setShowNewChatModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-all"
          >
            <MessageSquarePlus size={16} />
            Start New Chat
          </button>
        </div>
      )}

      {showNewChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Start a new chat</h2>
                <p className="text-sm text-gray-500">Search for a student, alumni, or admin.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewChatModal(false)}
                className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  placeholder="Search by name, headline, or skills"
                  className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 focus:border-transparent focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="max-h-80 space-y-2 overflow-y-auto">
                {isSearchingUsers ? (
                  <div className="flex items-center justify-center py-8 text-gray-500">
                    <Loader size={20} className="animate-spin" />
                  </div>
                ) : userSearchQuery.trim() && userResults.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-500">
                    No users found.
                  </div>
                ) : (
                  userResults.map((resultUser) => (
                    <button
                      key={resultUser._id}
                      type="button"
                      onClick={() => handleStartConversation(resultUser)}
                      className="flex w-full items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 text-left hover:border-blue-200 hover:bg-blue-50 transition-all"
                    >
                      <div className="h-11 w-11 flex-shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-semibold text-white flex items-center justify-center">
                        {resultUser.profilePicUrl ? (
                          <img
                            src={resultUser.profilePicUrl}
                            alt={resultUser.fullName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          getInitial(resultUser.fullName)
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-gray-900">{resultUser.fullName}</p>
                        <p className="truncate text-sm text-gray-500">
                          {resultUser.headline || resultUser.role}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
