const express = require('express');
const {
  addComment,
  createPost,
  deletePost,
  getFeed,
  likePost,
  updatePost,
  unlikePost
} = require('../controllers/postController');
const { requireAuth } = require('../middleware/auth');
const { asyncHandler } = require('../utils/asyncHandler');

const router = express.Router();

router.use(requireAuth);
router.get('/', asyncHandler(getFeed));
router.post('/', asyncHandler(createPost));
router.put('/:postId', asyncHandler(updatePost));
router.delete('/:postId', asyncHandler(deletePost));
router.post('/:postId/like', asyncHandler(likePost));
router.delete('/:postId/like', asyncHandler(unlikePost));
router.post('/:postId/comments', asyncHandler(addComment));

module.exports = router;
