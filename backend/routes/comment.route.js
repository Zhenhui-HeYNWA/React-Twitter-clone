import express from 'express';
import { protectRoute } from '../middleware/protectRoute.js';
import {
  replyToComment,
  commentOnPost,
  getSingleComment,
  getPostComments,
  deleteComment,
  getUserReplies,
  likeUnlikeComment,
  bookmarkComment,
} from '../controllers/comment.controller.js';
import { repost } from '../controllers/post.controller.js';
const router = express.Router();

router.post('/comment/:id/reply', protectRoute, replyToComment);
router.post('/comment/:id', protectRoute, commentOnPost);
router.post('/likes/:id', protectRoute, likeUnlikeComment);
router.post('/bookmarks/:id', protectRoute, bookmarkComment);

router.post('/repost/:onModel/:id', protectRoute, repost);

router.get('/:userId/comment', protectRoute, getUserReplies);
router.get('/:postId/comment/:username/:commentId', getSingleComment);
router.get('/:username/status/:postId/comments', protectRoute, getPostComments);
router.delete('/:id', protectRoute, deleteComment);
export default router;
