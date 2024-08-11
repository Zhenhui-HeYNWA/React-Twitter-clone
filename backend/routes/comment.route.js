import express from 'express';
import { protectRoute } from '../middleware/protectRoute.js';
import {
  replyToComment,
  commentOnPost,
  getSingleComment,
  getPostComments,
  deleteComment,
  getUserReplies
} from '../controllers/comment.controller.js';
const router = express.Router();

router.post('/comment/:id/reply', protectRoute, replyToComment);
router.post('/comment/:id', protectRoute, commentOnPost);
router.get('/:userId/comment',protectRoute,getUserReplies)
router.get('/:postId/comment/:username/:commentId', getSingleComment);
router.get('/:username/status/:id/comments', protectRoute, getPostComments);
router.delete('/:id', protectRoute, deleteComment);
export default router;
