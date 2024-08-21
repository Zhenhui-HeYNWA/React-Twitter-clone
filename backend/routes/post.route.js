import express from 'express';
import { protectRoute } from '../middleware/protectRoute.js';
import {
  bookmarkUnBookmark,
  createPost,
  getBookmarkPost,
  deletePost,
  getAllPosts,
  getFollowingPosts,
  getLikedPosts,
  getUserPosts,
  likeUnlikePost,
  getSinglePost,
  repostPost,
} from '../controllers/post.controller.js';

const router = express.Router();

router.get('/all', protectRoute, getAllPosts);
router.get('/following', protectRoute, getFollowingPosts);
router.get('/likes/:id', protectRoute, getLikedPosts);
router.get('/user/:username', protectRoute, getUserPosts);
// router.get('/bookmark/:id', protectRoute, getBookmarkPost);
router.get('/:username/status/:id', protectRoute, getSinglePost);

// router.get('/:username/status/:id/comments', protectRoute, getPostComments);
// router.post('/comment/:id', protectRoute, commentOnPost);
// router.get('/:postId/comment/:username/:commentId', getSingleComment);
// router.post('/comment/:id', protectRoute, commentOnPost);

router.post('/create', protectRoute, createPost);
router.post('/like/:id', protectRoute, likeUnlikePost);
// router.post('/comment/:id', protectRoute, commentOnPost);
router.post('/bookmark/:id', protectRoute, bookmarkUnBookmark);
router.post('/repost/:id', protectRoute, repostPost);
router.delete('/:id', protectRoute, deletePost);
// router.get('/:postId/comment/:username/:commentId', getSingleComment);

export default router;
