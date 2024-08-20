import express from 'express';

import { protectRoute } from '../middleware/protectRoute.js';
import {
  followUnfollowUser,
  getSuggestedUser,
  getFollowersUser,
  getFollowingUser,
  getUserProfile,
  updateUser,
  getSearchUser,
  getMentionedUsers,
  getUserLiked,
} from '../controllers/user.controller.js';

const router = express.Router();
router.get('/profile/:username', protectRoute, getUserProfile);
router.get('/suggested', protectRoute, getSuggestedUser);
router.get('/follower/:username', protectRoute, getFollowersUser);
router.get('/following/:username', protectRoute, getFollowingUser);
router.get('/search', protectRoute, getSearchUser);
router.get('/likes/:username', protectRoute, getUserLiked);
router.post('/follow/:id', protectRoute, followUnfollowUser);
router.post('/update', protectRoute, updateUser);

router.post('/check-user', getMentionedUsers);

export default router;
