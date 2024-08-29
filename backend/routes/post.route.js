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
  pinPost,
  quotePost,
} from '../controllers/post.controller.js';

const router = express.Router();

router.get('/all', protectRoute, getAllPosts);
router.get('/following', protectRoute, getFollowingPosts);
router.get('/likes/:id', protectRoute, getLikedPosts);
router.get('/user/:username', protectRoute, getUserPosts);

router.get('/:username/status/:id', protectRoute, getSinglePost);

router.post('/create', protectRoute, createPost);
router.post('/like/:id', protectRoute, likeUnlikePost);
router.post('/quote/:id', protectRoute, quotePost);
router.post('/bookmark/:id', protectRoute, bookmarkUnBookmark);
router.post('/repost/:id', protectRoute, repostPost);
router.post('/pin/:id', protectRoute, pinPost);
router.delete('/:id', protectRoute, deletePost);

export default router;
