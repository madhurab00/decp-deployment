const Comment = require('../models/Comment');
const Like = require('../models/Like');
const Post = require('../models/Post');
const { publishEvent } = require('../rabbitmq/connection');
const { buildAuthorSnapshot } = require('../services/snapshot');
const { parsePagination } = require('../utils/pagination');
const { createHttpError, sendSuccess } = require('../utils/response');
const {
  ensureObjectId,
  normalizeMedia,
  normalizeStringArray,
  requireNonEmptyString
} = require('../utils/validators');

const mapComment = (comment) => ({
  _id: comment._id,
  postId: comment.postId,
  userId: comment.userId,
  text: comment.text,
  parentCommentId: comment.parentCommentId,
  authorSnapshot: comment.authorSnapshot,
  createdAt: comment.createdAt,
  updatedAt: comment.updatedAt
});

const mapPost = (post, comments, currentUserId, likedPostIds) => ({
  _id: post._id,
  text: post.text,
  media: post.media,
  visibility: post.visibility,
  tags: post.tags,
  authorId: post.authorId,
  authorSnapshot: post.authorSnapshot,
  likeCount: post.likeCount,
  commentCount: post.commentCount,
  shareCount: post.shareCount,
  createdAt: post.createdAt,
  updatedAt: post.updatedAt,
  isOwner: currentUserId ? post.authorId.toString() === currentUserId.toString() : false,
  likedByMe: likedPostIds.has(post._id.toString()),
  comments: (comments.get(post._id.toString()) || []).map(mapComment),
  author: {
    _id: post.authorId,
    ...post.authorSnapshot
  },
  content: post.text,
  images: post.media.filter((item) => item.type === 'image').map((item) => item.url),
  likes: post.likeCount
});

const getOwnedPost = async (postId, user) => {
  const post = await Post.findById(postId);
  if (!post) {
    throw createHttpError(404, 'Post not found');
  }

  const isOwner = post.authorId.toString() === user.id.toString();
  const isAdmin = user.role === 'admin';

  if (!isOwner && !isAdmin) {
    throw createHttpError(403, 'You do not have permission to modify this post');
  }

  return post;
};

const createPost = async (req, res) => {
  const text = requireNonEmptyString(req.body.text || req.body.content, 'text', 'Post content');
  const media = normalizeMedia(req.body.media || req.body.images, ['image', 'video', 'document']);
  const tags = normalizeStringArray(req.body.tags);
  const visibility = ['public', 'dept', 'connections'].includes(req.body.visibility)
    ? req.body.visibility
    : 'public';

  const post = await Post.create({
    authorId: req.user.id,
    text,
    media,
    visibility,
    tags,
    authorSnapshot: buildAuthorSnapshot(req.user)
  });

  await publishEvent('decp_events', 'post.created', {
    postId: post._id.toString(),
    authorId: req.user.id,
    authorSnapshot: post.authorSnapshot,
    visibility: post.visibility
  });

  return sendSuccess(res, 201, mapPost(post, new Map(), req.user.id, new Set()), 'Post created successfully');
};

const getFeed = async (req, res) => {
  const { limit, page, skip } = parsePagination(req.query);
  const query = {};

  if (req.query.authorId) {
    ensureObjectId(req.query.authorId, 'authorId');
    query.authorId = req.query.authorId;
  }

  if (req.query.visibility && ['public', 'dept', 'connections'].includes(req.query.visibility)) {
    query.visibility = req.query.visibility;
  }

  const posts = await Post.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const postIds = posts.map((post) => post._id);
  const [comments, likes, total] = await Promise.all([
    Comment.find({ postId: { $in: postIds } }).sort({ createdAt: 1 }).lean(),
    Like.find({ postId: { $in: postIds }, userId: req.user.id }).lean(),
    Post.countDocuments(query)
  ]);

  const commentsByPost = comments.reduce((accumulator, comment) => {
    const key = comment.postId.toString();
    const current = accumulator.get(key) || [];
    current.push(comment);
    accumulator.set(key, current);
    return accumulator;
  }, new Map());

  const likedPostIds = new Set(likes.map((like) => like.postId.toString()));

  return sendSuccess(
    res,
    200,
    {
      items: posts.map((post) => mapPost(post, commentsByPost, req.user.id, likedPostIds)),
      page,
      limit,
      total
    },
    'Feed fetched successfully'
  );
};

const likePost = async (req, res) => {
  ensureObjectId(req.params.postId, 'postId');

  const post = await Post.findById(req.params.postId);
  if (!post) {
    throw createHttpError(404, 'Post not found');
  }

  const existingLike = await Like.findOne({ postId: post._id, userId: req.user.id });
  if (existingLike) {
    return sendSuccess(
      res,
      200,
      { postId: post._id, likeCount: post.likeCount, liked: true },
      'Post already liked'
    );
  }

  await Like.create({ postId: post._id, userId: req.user.id });
  post.likeCount += 1;
  await post.save();

  await publishEvent('decp_events', 'post.liked', {
    postId: post._id.toString(),
    postAuthorId: post.authorId.toString(),
    actorId: req.user.id,
    actorSnapshot: buildAuthorSnapshot(req.user)
  });

  return sendSuccess(
    res,
    200,
    { postId: post._id, likeCount: post.likeCount, liked: true },
    'Post liked successfully'
  );
};

const unlikePost = async (req, res) => {
  ensureObjectId(req.params.postId, 'postId');

  const post = await Post.findById(req.params.postId);
  if (!post) {
    throw createHttpError(404, 'Post not found');
  }

  const deletedLike = await Like.findOneAndDelete({ postId: post._id, userId: req.user.id });
  if (deletedLike && post.likeCount > 0) {
    post.likeCount -= 1;
    await post.save();
  }

  return sendSuccess(
    res,
    200,
    { postId: post._id, likeCount: post.likeCount, liked: false },
    'Post unliked successfully'
  );
};

const addComment = async (req, res) => {
  ensureObjectId(req.params.postId, 'postId');

  const text = requireNonEmptyString(
    req.body.text || req.body.content,
    'text',
    'Comment content'
  );
  const post = await Post.findById(req.params.postId);

  if (!post) {
    throw createHttpError(404, 'Post not found');
  }

  let parentCommentId = null;
  if (req.body.parentCommentId) {
    ensureObjectId(req.body.parentCommentId, 'parentCommentId');
    const parentComment = await Comment.findOne({
      _id: req.body.parentCommentId,
      postId: post._id
    });

    if (!parentComment) {
      throw createHttpError(404, 'Parent comment not found');
    }

    parentCommentId = parentComment._id;
  }

  const comment = await Comment.create({
    postId: post._id,
    userId: req.user.id,
    text,
    parentCommentId,
    authorSnapshot: buildAuthorSnapshot(req.user)
  });

  post.commentCount += 1;
  await post.save();

  await publishEvent('decp_events', 'post.commented', {
    postId: post._id.toString(),
    postAuthorId: post.authorId.toString(),
    actorId: req.user.id,
    actorSnapshot: buildAuthorSnapshot(req.user),
    commentId: comment._id.toString()
  });

  return sendSuccess(res, 201, mapComment(comment), 'Comment added successfully');
};

const updatePost = async (req, res) => {
  ensureObjectId(req.params.postId, 'postId');

  const post = await getOwnedPost(req.params.postId, req.user);
  const text = requireNonEmptyString(req.body.text || req.body.content, 'text', 'Post content');

  post.text = text;
  post.media = normalizeMedia(req.body.media || req.body.images, ['image', 'video', 'document']);
  post.tags = normalizeStringArray(req.body.tags);
  if (req.body.visibility && ['public', 'dept', 'connections'].includes(req.body.visibility)) {
    post.visibility = req.body.visibility;
  }

  await post.save();

  const comments = await Comment.find({ postId: post._id }).sort({ createdAt: 1 }).lean();
  const commentsByPost = new Map([[post._id.toString(), comments]]);

  return sendSuccess(
    res,
    200,
    mapPost(post.toObject(), commentsByPost, req.user.id, new Set()),
    'Post updated successfully'
  );
};

const deletePost = async (req, res) => {
  ensureObjectId(req.params.postId, 'postId');

  const post = await getOwnedPost(req.params.postId, req.user);

  await Promise.all([
    Comment.deleteMany({ postId: post._id }),
    Like.deleteMany({ postId: post._id }),
    Post.deleteOne({ _id: post._id })
  ]);

  return sendSuccess(res, 200, null, 'Post deleted successfully');
};

module.exports = {
  addComment,
  createPost,
  deletePost,
  getFeed,
  likePost,
  updatePost,
  unlikePost
};
