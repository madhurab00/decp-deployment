const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

const buildDirectKey = (firstId, secondId) => [String(firstId), String(secondId)].sort().join(':');

const buildUserSnapshot = (user) => ({
  userId: new mongoose.Types.ObjectId(user.userId || user._id),
  fullName: user.fullName || 'Unknown User',
  role: user.role || 'student',
  headline: user.headline || '',
  profilePicUrl: user.profilePicUrl || '',
});

const buildConversationResponse = (conversation, currentUserId) => {
  const plainConversation = conversation.toObject ? conversation.toObject() : conversation;
  const otherMember =
    plainConversation.memberSnapshots?.find(
      (member) => String(member.userId) !== String(currentUserId)
    ) || null;

  return {
    _id: plainConversation._id,
    type: plainConversation.type,
    title: plainConversation.title || null,
    otherMember,
    memberSnapshots: plainConversation.memberSnapshots || [],
    lastMessage: plainConversation.lastMessageId
      ? {
          _id: plainConversation.lastMessageId._id,
          text: plainConversation.lastMessageId.text,
          senderId: plainConversation.lastMessageId.senderId,
          createdAt: plainConversation.lastMessageId.createdAt,
        }
      : null,
    lastMessageAt:
      plainConversation.lastMessageAt ||
      plainConversation.lastMessageId?.createdAt ||
      plainConversation.updatedAt,
    createdAt: plainConversation.createdAt,
  };
};

const listConversations = async (req, res) => {
  const conversations = await Conversation.find({
    memberIds: req.user.userId,
  })
    .populate('lastMessageId', 'text senderId createdAt')
    .sort({ lastMessageAt: -1, updatedAt: -1 })
    .lean();

  res.json({
    success: true,
    data: conversations.map((conversation) =>
      buildConversationResponse(conversation, req.user.userId)
    ),
  });
};

const createOrGetDirectConversation = async (req, res) => {
  const { recipientId, recipientSnapshot } = req.body;

  if (!recipientId) {
    return res.status(400).json({
      success: false,
      message: 'recipientId is required',
      statusCode: 400,
    });
  }

  if (String(recipientId) === String(req.user.userId)) {
    return res.status(400).json({
      success: false,
      message: 'You cannot create a conversation with yourself',
      statusCode: 400,
    });
  }

  const directKey = buildDirectKey(req.user.userId, recipientId);
  let conversation = await Conversation.findOne({ directKey }).populate(
    'lastMessageId',
    'text senderId createdAt'
  );

  if (!conversation) {
    const currentUserSnapshot = buildUserSnapshot(req.user);
    const otherUserSnapshot = buildUserSnapshot({
      userId: recipientId,
      fullName: recipientSnapshot?.fullName,
      role: recipientSnapshot?.role,
      headline: recipientSnapshot?.headline,
      profilePicUrl: recipientSnapshot?.profilePicUrl,
    });

    conversation = await Conversation.create({
      type: 'direct',
      memberIds: [req.user.userId, recipientId],
      memberSnapshots: [currentUserSnapshot, otherUserSnapshot],
      createdById: req.user.userId,
      directKey,
      lastMessageAt: new Date(),
    });
  }

  res.status(201).json({
    success: true,
    data: buildConversationResponse(conversation, req.user.userId),
  });
};

const getMessages = async (req, res) => {
  const { conversationId } = req.params;
  const conversation = await Conversation.findOne({
    _id: conversationId,
    memberIds: req.user.userId,
  });

  if (!conversation) {
    return res.status(404).json({
      success: false,
      message: 'Conversation not found',
      statusCode: 404,
    });
  }

  const messages = await Message.find({ conversationId })
    .sort({ createdAt: 1 })
    .lean();

  res.json({
    success: true,
    data: messages.map((message) => ({
      _id: message._id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      text: message.text,
      attachments: message.attachments || [],
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    })),
  });
};

const sendMessage = async (req, res) => {
  const { conversationId } = req.params;
  const { text, attachments = [] } = req.body;

  if (!text?.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Message text is required',
      statusCode: 400,
    });
  }

  const conversation = await Conversation.findOne({
    _id: conversationId,
    memberIds: req.user.userId,
  });

  if (!conversation) {
    return res.status(404).json({
      success: false,
      message: 'Conversation not found',
      statusCode: 404,
    });
  }

  const message = await Message.create({
    conversationId,
    senderId: req.user.userId,
    text: text.trim(),
    attachments,
  });

  conversation.lastMessageId = message._id;
  conversation.lastMessageAt = message.createdAt;
  await conversation.save();

  res.status(201).json({
    success: true,
    data: {
      _id: message._id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      text: message.text,
      attachments: message.attachments || [],
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    },
  });
};

const deleteConversation = async (req, res) => {
  const { conversationId } = req.params;

  const conversation = await Conversation.findOne({
    _id: conversationId,
    memberIds: req.user.userId,
  });

  if (!conversation) {
    return res.status(404).json({
      success: false,
      message: 'Conversation not found',
      statusCode: 404,
    });
  }

  await Message.deleteMany({ conversationId });
  await Conversation.deleteOne({ _id: conversationId });

  res.json({
    success: true,
    message: 'Conversation deleted successfully',
  });
};

module.exports = {
  listConversations,
  createOrGetDirectConversation,
  getMessages,
  sendMessage,
  deleteConversation,
};
