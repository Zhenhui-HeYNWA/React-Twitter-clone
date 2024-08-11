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
} from '../controllers/user.controller.js';

const router = express.Router();
router.get('/profile/:username', protectRoute, getUserProfile);
router.get('/suggested', protectRoute, getSuggestedUser);
router.get('/follower/:username', protectRoute, getFollowersUser);
router.get('/following/:username', protectRoute, getFollowingUser);
router.get('/search', protectRoute, getSearchUser);
router.post('/follow/:id', protectRoute, followUnfollowUser);
router.post('/update', protectRoute, updateUser);

router.post('/check-user', getMentionedUsers);

export default router;
