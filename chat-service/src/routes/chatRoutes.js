const express = require('express');
const { protect } = require('../middleware/auth');
const {
  listConversations,
  createOrGetDirectConversation,
  getMessages,
  sendMessage,
  deleteConversation,
} = require('../controllers/chatController');

const router = express.Router();

router.use(protect);

router.get('/conversations', listConversations);
router.post('/conversations/direct', createOrGetDirectConversation);
router.get('/conversations/:conversationId/messages', getMessages);
router.post('/conversations/:conversationId/messages', sendMessage);
router.delete('/conversations/:conversationId', deleteConversation);

module.exports = router;
