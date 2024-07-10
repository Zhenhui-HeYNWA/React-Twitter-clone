import Notification from '../models/notification.model.js';
import User from '../models/user.model.js';

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
