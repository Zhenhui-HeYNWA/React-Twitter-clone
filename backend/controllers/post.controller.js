import Notification from '../models/notification.model.js';
import Post from '../models/post.model.js';
import User from '../models/user.model.js';
import { v2 as cloudinary } from 'cloudinary';
import mongoose from 'mongoose';

export const createPost = async (req, res) => {
  try {
    const { text, imgs, locationName } = req.body;

    // let { img } = req.body;
    const userId = req.user._id.toString();
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (!text && (!imgs || imgs.length === 0)) {
      return res.status(400).json({ error: 'Post must have text or images' });
    }

    if (imgs && imgs.length > 4) {
      return res
        .status(400)
        .json({ error: 'You can upload a maximum of 4 images' });
    }
    let uploadedImages = [];
    if (imgs && imgs.length > 0) {
      for (const img of imgs) {
        const uploadedResponse = await cloudinary.uploader.upload(img);
        uploadedImages.push(uploadedResponse.secure_url);
      }
    }
    const location =
      locationName && locationName.trim() ? locationName : 'Earth';
    const newPost = new Post({
      user: userId,
      text,
      imgs: uploadedImages,
      postLocation: location,
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

    // Delete images associated with the post (either original or quote post)
    if (post.imgs && post.imgs.length > 0) {
      for (const img of post.imgs) {
        const imgId = img.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(imgId);
      }
    }

    let originalPostId = req.params.id;

    // If the post is a repost, handle the repost logic
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
      // If the post is the original post, handle all repost logic
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

    // If the post is a quote, decrement repostByNum of the original post
    if (post.quote && post.quote.originalPost) {
      await Post.findByIdAndUpdate(
        post.quote.originalPost,
        { $inc: { repostByNum: -1 } },
        { session }
      );
    }

    // Delete the original post or quoted post
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
        originalImgs: originalPost.imgs,
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
  const { text, imgs = [], location } = req.body;
  const { id: originalPostId } = req.params;
  const userId = req.user._id;

  try {
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!text && (!imgs || imgs.length === 0)) {
      return res.status(400).json({ error: 'Post must have text or images' });
    }

    if (imgs.length > 4) {
      return res
        .status(400)
        .json({ error: 'You can upload a maximum of 4 images' });
    }

    const originalPost = await Post.findById(originalPostId).populate('user');
    console.log('123', originalPost);

    if (!originalPost) {
      return res.status(404).json({ message: 'Original post not found' });
    }

    let uploadedImages = [];
    if (imgs.length > 0) {
      for (const img of imgs) {
        const uploadedResponse = await cloudinary.uploader.upload(img);
        uploadedImages.push(uploadedResponse.secure_url);
      }
    }

    const isRepost = !!originalPost.repost.originalPost;

    // 检查帖子是否已经是引用的帖子
    const isAlreadyQuote = !!originalPost.quote?.originalPost;

    const quoteData = isRepost
      ? {
          originalPost: originalPost.repost.originalPost,
          originalUser: {
            _id: originalPost.repost.postOwner._id,
            username: originalPost.repost.postOwner.username,
            fullName: originalPost.repost.postOwner.fullName,
            profileImg: originalPost.repost.postOwner.profileImg,
          },
          originalText: originalPost.repost.originalText,
          originalImgs: originalPost.repost.originalImgs,
        }
      : {
          originalPost: originalPost._id,
          originalUser: {
            _id: originalPost.user._id,
            username: originalPost.user.username,
            fullName: originalPost.user.fullName,
            profileImg: originalPost.user.profileImg,
          },
          originalText: originalPost.text,
          originalImgs: originalPost.imgs,
        };

    // 如果原始帖子已经是引用帖，添加链接到最初的帖子
    if (isAlreadyQuote) {
      quoteData.originalText =
        originalPost.text +
        ` /${originalPost.quote.originalUser.username}/status/${originalPost._id}`;
    }

    const postLocation = location && location.trim() ? location : 'Earth';

    const newQuotePost = new Post({
      user: userId,
      text,
      imgs: uploadedImages,
      postLocation,
      quote: quoteData,
    });

    const savedQuotePost = await newQuotePost.save();

    originalPost.repostByNum += 1;

    if (isRepost) {
      const originalOriginalPost = await Post.findById(
        originalPost.repost.originalPost
      );
      if (originalOriginalPost) {
        originalOriginalPost.repostByNum += 1;
        await originalOriginalPost.save();
      }
    }

    await originalPost.save();

    await User.findByIdAndUpdate(
      userId,
      { $push: { userPosts: savedQuotePost._id } },
      { new: true }
    );

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

    return res.status(201).json(savedQuotePost);
  } catch (error) {
    console.error('Error creating quoted post:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
export const pinPost = async (req, res) => {
  const { id: postId } = req.params;
  const userId = req.user._id.toString();

  try {
    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ error: 'User not found' });

    const post = await Post.findById(postId);

    if (!post) return res.status(404).json({ error: 'Post not found' });

    if (post.user._id.toString() !== userId)
      return res.status(400).json({ error: 'You can only pin your own post' });

    if (
      user.pinnedPost.length > 0 &&
      user.pinnedPost[0].toString() === postId
    ) {
      // 如果用户已经置顶了这个帖子，取消置顶
      user.pinnedPost = [];
      await user.save();
      return res.status(200).json({ message: 'Post unpinned successfully' });
    } else {
      // 用户置顶新帖子
      user.pinnedPost = [postId];
      await user.save();
      return res.status(200).json({ message: 'Post pinned successfully' });
    }
  } catch (error) {
    console.log('Error in pinPost controller:', error);
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
