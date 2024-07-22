import express from 'express';
import { protectRoute } from '../middleware/protectRoute.js';
import {
  bookmarkUnBookmark,
  commentOnPost,
  createPost,
  getBookmarkPost,
  deletePost,
  getAllPosts,
  getFollowingPosts,
  getLikedPosts,
  getUserPosts,
  likeUnlikePost,
} from '../controllers/post.controller.js';

const router = express.Router();

router.get('/all', protectRoute, getAllPosts);
router.get('/following', protectRoute, getFollowingPosts);
router.get('/likes/:id', protectRoute, getLikedPosts);
router.get('/user/:username', protectRoute, getUserPosts);
router.get('/bookmark/:id', protectRoute, getBookmarkPost);
router.post('/create', protectRoute, createPost);
router.post('/like/:id', protectRoute, likeUnlikePost);
router.post('/comment/:id', protectRoute, commentOnPost);
router.post('/bookmark/:id', protectRoute, bookmarkUnBookmark);
router.delete('/:id', protectRoute, deletePost);

export default router;
