import Notification from '../models/notification.model.js';
import Post from '../models/post.model.js';
import User from '../models/user.model.js';
import { v2 as cloudinary } from 'cloudinary';
import mongoose from 'mongoose';

export const createPost = async (req, res) => {
  try {
    const { text } = req.body;
    console.log(text);
    let { img } = req.body;
    const userId = req.user._id.toString();
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (!text && !img) {
      return res.status(400).json({ error: 'Post must have text or image' });
    }

    if (img) {
      const uploadedResponse = await cloudinary.uploader.upload(img);
      img = uploadedResponse.secure_url;
    }

    const newPost = new Post({
      user: userId,
      text,
      img,
    });
    await newPost.save();

    await User.findByIdAndUpdate(userId, {
      $push: { userPosts: newPost._id },
    });

    const mentionRegex = /@(\w+)/g;
    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
      const mentionedUsername = match[1];
      const mentionedUser = await User.findOne({ username: mentionedUsername });

      if (mentionedUser) {
        const notification = new Notification({
          from: userId,
          to: mentionedUser._id,
          type: 'mention',
        });
        await notification.save();
      }
    }
    res.status(201).json(newPost);
  } catch (error) {
    console.log('error in createPost controller', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deletePost = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  const userId = req.user._id;
  try {
    const post = await Post.findById(req.params.id).session(session);
    if (!post) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Post not found' });
    }
    if (post.user._id.toString() !== userId.toString()) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(401)
        .json({ message: 'You have no right to delete this post' });
    }

    if (post.img) {
      const imgId = post.img.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(imgId);
    }

    let originalPostId = req.params.id;

    // 如果帖子是转发帖，则处理转发逻辑
    if (post.repost && post.repost.originalPost) {
      originalPostId = post.repost.originalPost;

      await Post.findByIdAndUpdate(
        originalPostId,
        { $inc: { repostByNum: -1 }, $pull: { repostBy: post.user } },
        { session }
      );

      await User.updateMany(
        { repostedPosts: originalPostId },
        { $pull: { repostedPosts: originalPostId, userPosts: post._id } },
        { session }
      );
    } else {
      // 如果帖子是原始帖子，处理所有转发逻辑
      const reposts = await Post.find({
        'repost.originalPost': originalPostId,
      }).session(session);

      const repostIds = reposts.map((repost) => repost._id);

      await Post.deleteMany({ _id: { $in: repostIds } }).session(session);

      await User.updateMany(
        { repostedPosts: originalPostId },
        {
          $pull: {
            repostedPosts: originalPostId,
            userPosts: { $in: repostIds.concat(originalPostId) },
          },
        },
        { session }
      );
    }

    await User.findByIdAndUpdate(
      userId,
      { $pull: { userPosts: req.params.id } },
      { session }
    );

    await Post.findByIdAndDelete(req.params.id).session(session);

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      message:
        'Post and all related reposts have been deleted from the database',
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.log('Error in deletePost controller:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const likeUnlikePost = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id: postId } = req.params;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if the user has already liked the post
    const userLikedPost = await User.findOne({
      _id: userId,
      'likes.item': postId,
      'likes.onModel': 'Post',
    });

    if (userLikedPost) {
      // Unlike the post if it was already liked
      await Post.updateOne({ _id: postId }, { $pull: { likes: userId } });

      await User.updateOne(
        { _id: userId },
        { $pull: { likes: { item: postId, onModel: 'Post' } } }
      );

      const updatedPost = await Post.findById(postId);
      res.status(200).json({
        message: 'Post unliked successfully',
        likes: updatedPost.likes,
      });
    } else {
      // Like the post if it wasn't already liked
      await Post.updateOne({ _id: postId }, { $push: { likes: userId } });

      await User.updateOne(
        { _id: userId },
        { $push: { likes: { item: postId, onModel: 'Post' } } }
      );

      const notification = new Notification({
        from: userId,
        to: post.user,
        type: 'likes',
        post: postId, // include post ID in the notification
      });
      await notification.save();

      const updatedPost = await Post.findById(postId);
      res
        .status(200)
        .json({ message: 'Post liked successfully', likes: updatedPost.likes });
    }
  } catch (error) {
    console.log('Error in likeUnlikePost controller:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const bookmarkUnBookmark = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id: postId } = req.params;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const userBookmarkedPost = post.bookmarks.includes(userId);

    if (userBookmarkedPost) {
      // Unbookmark the post
      await Post.updateOne({ _id: postId }, { $pull: { bookmarks: userId } });
      await User.updateOne(
        { _id: userId },
        { $pull: { bookmarks: { item: postId, onModel: 'Post' } } }
      );
    } else {
      // Bookmark the post
      await Post.updateOne({ _id: postId }, { $push: { bookmarks: userId } });
      await User.updateOne(
        { _id: userId },
        { $push: { bookmarks: { item: postId, onModel: 'Post' } } }
      );
    }

    // Fetch the updated post to return the latest bookmarks array
    const updatedPost = await Post.findById(postId);
    res.status(200).json(updatedPost.bookmarks);
  } catch (error) {
    console.log('Error in bookmarkUnBookmark controller:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const repostPost = async (req, res) => {
  try {
    const { id: postId } = req.params; // ID of the post to be reposted
    const userId = req.user._id; // ID of the current user

    // Find the post to be reposted
    const repostPost = await Post.findById(postId).populate(
      'user',
      'username fullName profileImg'
    );
    if (!repostPost) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Determine the original post ID
    const originalPostId = repostPost.repost?.originalPost || postId;

    // Find the original post
    const originalPost = await Post.findById(originalPostId);
    if (!originalPost) {
      return res.status(404).json({ message: 'Original post not found' });
    }

    // Find the original post's user
    const originalUser = await User.findById(originalPost.user);
    if (!originalUser) {
      return res.status(404).json({ message: 'Original post user not found' });
    }

    // Check if the user has already reposted the original post
    const existingRepost = await Post.findOne({
      'repost.originalPost': originalPostId,
      user: userId,
    });

    if (existingRepost) {
      // If a repost already exists, delete it
      await Post.findByIdAndDelete(existingRepost._id);

      // Update the original post's repost count and remove the user from repostBy
      await Post.findByIdAndUpdate(originalPostId, {
        $inc: { repostByNum: -1 }, // Decrement repost count
        $pull: { repostBy: userId }, // Remove the user from repostBy array
      });

      // Update the user's repostedPosts and userPosts arrays
      await User.findByIdAndUpdate(userId, {
        $pull: {
          repostedPosts: originalPostId, // Remove the original post ID
          userPosts: existingRepost._id, // Remove the repost ID
        },
      });

      return res.status(200).json({ message: 'Repost successfully removed' });
    }

    // Create a new repost
    const newRepost = new Post({
      user: userId,
      repost: {
        originalPost: originalPostId,
        postOwner: {
          _id: originalUser._id,
          username: originalUser.username,
          fullName: originalUser.fullName,
          profileImg: originalUser.profileImg,
        },
        originalText: originalPost.text,
        originalImg: originalPost.img,
        repostUser: userId,
        repostNum: 1, // Initial repost count
      },
      repostBy: [userId], // Add the current user to repostBy array
    });

    await newRepost.save();

    // Update the original post's repost count and add the user to repostBy array
    await Post.findByIdAndUpdate(originalPostId, {
      $inc: { repostByNum: 1 }, // Increment repost count
      $addToSet: { repostBy: userId }, // Add the user to repostBy array
    });

    // Add the original post ID and the new repost ID to the user's repostedPosts and userPosts arrays
    await User.findByIdAndUpdate(userId, {
      $addToSet: {
        repostedPosts: originalPostId, // Ensure the original post ID is unique
        userPosts: newRepost._id, // Ensure the repost ID is unique
      },
    });

    res.status(201).json(newRepost); // Return the newly created repost
  } catch (error) {
    console.log('Error in repostPost controller:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const quotePost = async (req, res) => {
  try {
    const { text } = req.body;
    const { id: postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const quote = new Post({
      user: userId,
      text,
      quote: postId,
    });
    await quote.save();

    res.status(201).json(quote);
  } catch (error) {
    console.log('Error in quotePost controller:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAllPosts = async (req, res) => {
  try {
    //.populate() can show the entire document ( detail)  in the posts not just the reference
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate({ path: 'user', select: '-password' })
      .populate({
        path: 'comments',
        match: { isDeleted: { $ne: true } },
        populate: {
          path: 'user',
          select: '-password',
        },
      });

    if (posts.length === 0) {
      return res.status(404).json({ message: 'Posts not found!' });
    }

    res.status(200).json(posts);
  } catch (error) {
    console.log('Error in getAllPosts controller:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getLikedPosts = async (req, res) => {
  const userId = req.params.id;

  try {
    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Extract liked posts from the user's likes array
    const likedPostIds = user.likes
      .filter((like) => like.onModel === 'Post') // Filter only likes on Posts
      .map((like) => like.item);

    // Fetch the liked posts and populate necessary fields
    const likedPosts = await Post.find({ _id: { $in: likedPostIds } })
      .populate({ path: 'user', select: 'username fullName profileImg' }) // Populate the user who created the post
      .populate({
        path: 'comments',
        match: { isDeleted: { $ne: true } }, // Only include non-deleted comments
        populate: {
          path: 'user',
          select: 'username fullName profileImg', // Populate the user who made the comment
        },
      });

    // Send the liked posts as a response
    res.status(200).json(likedPosts);
  } catch (error) {
    console.error('Error in getLikedPosts controller:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getFollowingPosts = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) res.status(404).json({ error: 'User not found' });

    const followings = user.followings;
    const followingPosts = await Post.find({ user: { $in: followings } })
      .sort({
        createdAt: -1,
      })
      .populate({
        path: 'user',
        select: '-password',
      })

      .populate({
        path: 'comments',
        match: {
          isDeleted: { $ne: true },
        },
        populate: { path: 'user', select: '-password' },
      });
    res.status(200).json(followingPosts);
  } catch (error) {
    console.log('Error in getFollowingPosts controller:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUserPosts = async (req, res) => {
  try {
    const username = req.params;
    const user = await User.findOne(username);
    if (!user) res.status(404).json({ error: 'User not found' });

    const posts = await Post.find({
      $or: [
        { user: user._id },
        { repost: { $exists: true, $ne: null }, user: user._id },
        { quote: { $exists: true, $ne: null }, user: user._id },
      ],
    })
      .sort({ createdAt: -1 })
      .populate({
        path: 'user',
        select: '-password',
      })
      .populate({
        path: 'comments',
        match: { isDeleted: { $ne: true } },
        populate: { path: 'user', select: '-password' },
      })
      .populate({
        path: 'repost',
        populate: {
          path: 'user',
          select: '-password',
        },
      })
      .populate({
        path: 'quote',
        populate: {
          path: 'user',
          select: '-password',
        },
      });

    res.status(200).json(posts);
  } catch (error) {
    console.log('Error in getUserPosts Controller:', error);
    res.status(500).json('Internal server error');
  }
};

export const getBookmarkPost = async (req, res) => {
  const userId = req.params.id;

  try {
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
    }

    const bookmarks = await Post.find({ _id: { $in: user.bookmarks } })
      .populate({ path: 'user', select: '-password' })
      .populate({
        path: 'comments',
        match: { isDeleted: { $ne: true } },
        populate: { path: 'user', select: '-password' },
      });

    res.status(200).json(bookmarks);
  } catch (error) {
    console.log('Error in getBookmarks controller:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getSinglePost = async (req, res) => {
  const { id: postId } = req.params;

  try {
    // Find the post and populate the user and comments
    const post = await Post.findById(postId)
      .populate('user', '-password') // populate post user without password
      .populate({
        path: 'comments',
        match: { isDeleted: { $ne: true } },
        populate: {
          path: 'user',
          select: 'fullName username profileImg',
        },
      });

    if (!post) return res.status(404).json({ error: 'Post not found' });

    // Filter out comments with isDeleted: true
    post.comments = post.comments.filter((comment) => !comment.isDeleted);

    res.status(200).json(post);
  } catch (error) {
    console.log('Error in getSinglePost controller:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
