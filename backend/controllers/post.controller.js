import { handleMentions } from '../lib/utils/mentionHelper.js';
import Notification from '../models/notification.model.js';
import Post from '../models/post.model.js';
import User from '../models/user.model.js';
import Comment from '../models/comment.model.js';
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

    await handleMentions(text, userId);
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
        console.log(`Deleted image from cloudinary: ${imgId}`);
      }
    }

    let originalPostId = req.params.id;

    // If the post is a repost, handle the repost logic
    if (post.repost && post.repost.originalPost) {
      originalPostId = post.repost.originalPost;

      // Check if the repost is from a comment or post
      const onModel = post.repost.onModel || 'Post';
      const model = onModel === 'Comment' ? 'Comment' : 'Post';

      await mongoose
        .model(model)
        .findByIdAndUpdate(
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
      originalPostId = post._id;

      const reposts = await Post.find({
        'repost.originalPost': originalPostId,
      }).session(session);

      const repostIds = reposts.map((repost) => repost._id);

      await Post.deleteMany({ _id: { $in: repostIds } }).session(session);

      await User.updateMany(
        { repostedPosts: originalPostId },
        {
          $inc: { repostByNum: -1 },
          $pull: {
            repostedPosts: originalPostId,
            userPosts: { $in: repostIds.concat(originalPostId) },
          },
        },
        { session }
      );
      console.log(
        `Updated users after deleting original post and reposts: ${originalPostId}`
      );
    }

    // If the post is a quote referencing a Comment, decrement repostByNum of the original comment
    if (
      post.quote &&
      post.quote.onModel === 'Comment' &&
      post.quote.originalPost
    ) {
      await Comment.findByIdAndUpdate(
        post.quote.originalPost,
        { $inc: { repostByNum: -1 } },
        { session }
      );
      console.log(
        `Decremented repostByNum for quoted original comment: ${post.quote.originalPost}`
      );
    }

    // Delete the original post or quoted post
    await User.findByIdAndUpdate(
      userId,
      { $pull: { userPosts: req.params.id } },
      { session }
    );
    console.log(`Removed post from user's post list: ${req.params.id}`);

    await Post.findByIdAndDelete(req.params.id).session(session);
    console.log(`Deleted post from database: ${req.params.id}`);

    await session.commitTransaction();
    session.endSession();

    console.log('Transaction committed successfully');
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

export const repost = async (req, res) => {
  try {
    const { id: originalId, onModel } = req.params; // ID of the original content (post or comment) and onModel to determine its type (Post or Comment)
    const userId = req.user._id; // Current user's ID

    // Ensure onModel is either Post or Comment
    if (!['Post', 'Comment'].includes(onModel)) {
      return res
        .status(400)
        .json({ message: 'Invalid content type for repost' });
    }

    // Find the original content (either a post or comment)
    const originalContent = await mongoose
      .model(onModel)
      .findById(originalId)
      .populate('user');
    if (!originalContent) {
      return res.status(404).json({ message: `${onModel} not found` });
    }

    // Check if the user has already reposted the original content
    const existingRepost = await Post.findOne({
      'repost.originalPost': originalId,
      user: userId,
    });

    if (existingRepost) {
      // If a repost already exists, delete it
      await Post.findByIdAndDelete(existingRepost._id);

      // Update the repost count and remove the user from repostBy of the original content
      await mongoose.model(onModel).findByIdAndUpdate(originalId, {
        $inc: { repostByNum: -1 }, // Decrement repost count
        $pull: { repostBy: userId }, // Remove the user from repostBy array
      });

      // Update the user's repostedPosts or repostedComments and userPosts arrays
      const updateFields = {
        repostedPosts: originalId,
      };
      // Use repostedComments for comments
      await User.findByIdAndUpdate(userId, {
        $pull: {
          ...updateFields, // Remove the original post/comment ID from the appropriate array
          userPosts: existingRepost._id, // Remove the repost ID
        },
      });

      return res.status(200).json({ message: 'Repost successfully removed' });
    }

    // If no repost exists, create a new repost
    const repostData = {
      user: userId,
      repost: {
        originalPost: originalId,
        postOwner: {
          _id: originalContent.user._id,
          username: originalContent.user.username,
          fullName: originalContent.user.fullName,
          profileImg: originalContent.user.profileImg,
        },
        originalText: originalContent.text,
        originalImgs: originalContent.imgs || [],
        repostUser: userId,
        repostNum: 1, // Initial repost count
        onModel, // Specify if it's a repost of a post or a comment
      },
      repostBy: [userId], // Add the current user to repostBy array
    };

    // 如果是 Comment 转发，则查找评论的 postId，并添加到 repost.commentId 中
    if (onModel === 'Comment') {
      const commentPostId = originalContent.postId;
      if (!commentPostId) {
        return res
          .status(404)
          .json({ message: 'Post for this comment not found' });
      }
      repostData.repost.commentId = commentPostId; // 添加评论所属的 postId 到 repost.commentId
    }

    // 检查是否有引用内容 (quote)，如果是引用，则一起添加
    if (originalContent.quote) {
      repostData.quote = {
        originalPost: originalContent.quote.originalPost,
        originalUser: originalContent.quote.originalUser,
        originalText: originalContent.quote.originalText,
        originalImgs: originalContent.quote.originalImgs,
        originalCreatedAt: originalContent.quote.originalCreatedAt,
      };
    }

    const newRepost = new Post(repostData);
    await newRepost.save();

    // Update the repost count and add the user to repostBy array of the original content
    await mongoose.model(onModel).findByIdAndUpdate(originalId, {
      $inc: { repostByNum: 1 }, // Increment repost count
      $addToSet: { repostBy: userId }, // Add the user to repostBy array
    });

    // Update the user's repostedPosts or repostedComments and userPosts arrays
    const addFields = { repostedPosts: originalId };
    // Use repostedComments for comments
    await User.findByIdAndUpdate(userId, {
      $addToSet: {
        ...addFields, // Add the original post/comment ID to the appropriate array
        userPosts: newRepost._id, // Ensure the repost ID is unique
      },
    });

    res.status(201).json(newRepost); // Return the newly created repost
  } catch (error) {
    console.log('Error in repost controller:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const quotePost = async (req, res) => {
  const { text, imgs = [], location } = req.body;
  const { id: originalId, onModel } = req.params;
  const userId = req.user._id;

  try {
    if (!['Post', 'Comment'].includes(onModel)) {
      return res
        .status(400)
        .json({ message: 'Invalid content type for quote' });
    }

    const originalContent = await mongoose
      .model(onModel)
      .findById(originalId)
      .populate('user');

    if (!originalContent) {
      return res.status(404).json({ message: `${onModel} not found` });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (!text && (!imgs || imgs.length === 0)) {
      return res.status(400).json({ error: 'Quote must have text or images' });
    }
    if (imgs.length > 4) {
      return res
        .status(400)
        .json({ error: 'You can upload a maximum of 4 images' });
    }

    let uploadedImages = [];
    if (imgs.length > 0) {
      for (const img of imgs) {
        const uploadedResponse = await cloudinary.uploader.upload(img);
        uploadedImages.push(uploadedResponse.secure_url);
      }
    }

    const quoteData = {
      originalPost: originalId,
      originalUser: {
        _id: originalContent.user._id,
        username: originalContent.user.username,
        fullName: originalContent.user.fullName,
        profileImg: originalContent.user.profileImg,
      },
      originalText: originalContent.text,
      originalImgs: originalContent.imgs || [],
      originalCreatedAt: originalContent.createdAt,
      onModel,
    };

    if (onModel === 'Comment' && originalContent.parentId) {
      const parentComment = await Comment.findById(
        originalContent.parentId
      ).populate({
        path: 'user', // 确保查询出 user 数据
        select: 'username fullName profileImg',
      });

      if (parentComment && parentComment.user) {
        quoteData.replyToUser = {
          _id: parentComment.user._id,
          username: parentComment.user.username,
          fullName: parentComment.user.fullName,
          profileImg: parentComment.user.profileImg,
        };
      }
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

    await mongoose.model(onModel).findByIdAndUpdate(originalId, {
      $inc: { repostByNum: 1 },
      $addToSet: { repostBy: userId },
    });

    await User.findByIdAndUpdate(
      userId,
      { $push: { userPosts: savedQuotePost._id } },
      { new: true }
    );

    await handleMentions(text, userId);

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
