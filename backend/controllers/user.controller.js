import Notification from '../models/notification.model.js';
import { v2 as cloudinary } from 'cloudinary';

//models
import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import Post from '../models/post.model.js';
import Comment from '../models/comment.model.js';

export const getUserProfile = async (req, res) => {
  const { username } = req.params;

  try {
    const user = await User.findOne({ username }).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    console.log('Error in getUserProfile:', error.message);
    res.status(500).json({ error: error.message });
  }
};

export const getUserLiked = async (req, res) => {
  try {
    const username = req.params.username;

    // Find the user by username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Separate liked posts and comments based on `onModel`
    const likedPosts = [];
    const likedComments = [];

    user.likes.forEach((like) => {
      if (like.onModel === 'Post') {
        likedPosts.push(like.item);
      } else if (like.onModel === 'Comment') {
        likedComments.push(like.item);
      }
    });

    // Fetch the liked posts
    const posts = await Post.find({ _id: { $in: likedPosts } })
      .populate({ path: 'user', select: '-password' })
      .populate({
        path: 'comments',
        match: { isDeleted: { $ne: true } },
        populate: {
          path: 'user',
          select: '-password',
        },
      });

    // Fetch the liked comments
    const comments = await Comment.find({ _id: { $in: likedComments } })
      .populate({ path: 'user', select: '-password' })
      .populate({
        path: 'postId',
        populate: {
          path: 'user',
          select: '-password',
        },
      });

    // Combine liked posts and comments into one array
    const likedItems = [...posts, ...comments];

    res.status(200).json(likedItems);
  } catch (error) {
    console.log('Error in getUserLiked controller:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const followUnfollowUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userTomModify = await User.findById(id);
    const currentUser = await User.findById(req.user._id);
    if (id === req.user._id.toString()) {
      return res
        .status(400)
        .json({ message: "You can't follow/unFollow yourself " });
    }
    if (!userTomModify || !currentUser)
      return res.status(400).json({ error: 'User not found' });
    const isFollowing = currentUser.followings.includes(id);
    if (isFollowing) {
      //Unfollow the user
      await User.findByIdAndUpdate(id, { $pull: { followers: req.user._id } });
      await User.findByIdAndUpdate(req.user._id, {
        $pull: { followings: id },
      });
      //TODO: return the id of the user as a response
      res.status(200).json({ message: 'User unFollowed successfully' });
    } else {
      //Follow user
      //Followers: req.user._id
      //Following: id
      await User.findByIdAndUpdate(id, { $push: { followers: req.user._id } });
      await User.findByIdAndUpdate(req.user._id, { $push: { followings: id } });
      //TODO:send notification to the user
      const newNotification = new Notification({
        type: 'follow',
        from: req.user._id,
        to: userTomModify._id,
      });

      await newNotification.save();

      //TODO: return the id of the user as a response
      res.status(200).json({ message: 'User follow successfully' });
    }
  } catch (error) {
    console.log('Error in followUnfollowUser:', error.message);
    res.status(500).json({ error: error.message });
  }
};

export const getSuggestedUser = async (req, res) => {
  try {
    const userId = req.user._id;

    const userFollowingByMe = await User.findById(userId).select('followings');

    const users = await User.aggregate([
      {
        $match: {
          //search the users that not match to our user id
          _id: { $ne: userId },
        },
      },
      //return 10 random users
      { $sample: { size: 10 } },
    ]);

    const filteredUsers = users.filter(
      (user) => !userFollowingByMe.followings.includes(user._id)
    );

    const suggestedUsers = filteredUsers.slice(0, 4);
    suggestedUsers.forEach((user) => (user.password = null));
    res.status(200).json(suggestedUsers);
  } catch (error) {
    console.log('Error in getSuggested:', error.message);
    res.status(500).json({ error: error.message });
  }
};
export const getFollowersUser = async (req, res) => {
  const { username } = req.params;
  try {
    const user = await User.findOne({ username })
      .select('followers')
      .populate('followers', '-password -email'); // 填充 followers 信息，并排除 password 和 email 字段
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user.followers);
  } catch (error) {
    console.log('Error in getFollowers:', error.message);
    res.status(500).json({ error: error.message });
  }
};

export const getFollowingUser = async (req, res) => {
  const { username } = req.params;
  try {
    const user = await User.findOne({ username })
      .select('followings')
      .populate('followings', '-password -email');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user.followings);
  } catch (error) {
    console.log('Error in getFollowers:', error.message);
    res.status(500).json({ error: error.message });
  }
};
export const updateUser = async (req, res) => {
  const { fullName, email, username, currentPassword, newPassword, bio, link } =
    req.body;
  let { profileImg, coverImg } = req.body;

  const userId = req.user._id;

  try {
    let user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Update password if both currentPassword and newPassword are provided
    if (currentPassword && newPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }

      if (newPassword.length < 6) {
        return res
          .status(400)
          .json({ error: 'Password must be at least 6 characters' });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    } else if (currentPassword || newPassword) {
      return res.status(400).json({
        error: 'Please provide both current password and new password',
      });
    }

    // Update profile image
    if (profileImg) {
      if (user.profileImg) {
        await cloudinary.uploader.destroy(
          user.profileImg.split('/').pop().split('.')[0]
        );
      }
      const uploadedResponse = await cloudinary.uploader.upload(profileImg);
      user.profileImg = uploadedResponse.secure_url;
    }

    // Update cover image
    if (coverImg) {
      if (user.coverImg) {
        await cloudinary.uploader.destroy(
          user.coverImg.split('/').pop().split('.')[0]
        );
      }
      const uploadedResponse = await cloudinary.uploader.upload(coverImg);
      user.coverImg = uploadedResponse.secure_url;
    }

    // Update other fields
    user.fullName = fullName || user.fullName;
    user.email = email || user.email;
    user.username = username || user.username;
    user.bio = bio || user.bio;
    user.link = link || user.link;

    // Save user and remove password from response
    user = await user.save();
    user.password = null;

    return res.status(200).json(user);
  } catch (error) {
    console.log('Error in updateUser:', error.message);
    res.status(500).json({ error: error.message });
  }
};

export const getSearchUser = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q)
      return res.status(400).json({ error: 'Query parameter is required' });

    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { fullName: { $regex: q, $options: 'i' } },
      ],
    }).select('-password');
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMentionedUsers = async (req, res) => {
  try {
    // 获取 userames，如果未定义或者不是数组，设置为空数组
    const { usernames } = req.body;
    if (!Array.isArray(usernames)) {
      return res.status(400).json({ error: 'usernames must be an array' });
    }

    // 在数据库中查找这些用户名
    const users = await User.find({ username: { $in: usernames } });

    // 使用 reduce 方法构建一个字典，将存在的用户名标记为 true
    const userExistMap = users.reduce((acc, user) => {
      acc[user.username] = true;
      return acc;
    }, {});

    // 对于不存在的用户名，将其标记为 false
    usernames.forEach((username) => {
      if (!userExistMap[username]) {
        userExistMap[username] = false;
      }
    });

    // 返回一个对象，表示每个用户名是否存在
    res.json(userExistMap);
  } catch (error) {
    console.error('Error checking user existence:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
