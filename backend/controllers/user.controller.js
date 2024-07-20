import Notification from '../models/notification.model.js';
import { v2 as cloudinary } from 'cloudinary';

//models
import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';

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
