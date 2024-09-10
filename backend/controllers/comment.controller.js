import Post from '../models/post.model.js';
import User from '../models/user.model.js';
import Comment from '../models/comment.model.js';
import Notification from '../models/notification.model.js';
import { v2 as cloudinary } from 'cloudinary';
//Get Post Top level comments

import mongoose from 'mongoose';

export const getPostComments = async (req, res) => {
  const { postId } = req.params;

  // 检查 postId 是否有效
  if (!mongoose.Types.ObjectId.isValid(postId)) {
    return res.status(400).json({ error: 'Invalid postId' });
  }

  try {
    const post = await Post.findById(postId).populate({
      path: 'comments',
      match: { parentId: null, isDeleted: { $ne: true } }, // 过滤顶级非删除评论
      options: {
        sort: { createdAt: -1 }, // 按创建日期降序排列
      },
      populate: [
        {
          path: 'user',
          select: 'username fullName profileImg', // 填充用户信息
        },
        {
          path: 'postId',
          populate: {
            path: 'user',
            select: 'username fullName profileImg', // 填充帖子的用户信息
          },
        },
      ],
    });

    if (!post) {
      return res.status(404).json({
        error: 'Post not found',
      });
    }

    res.status(200).json(post.comments);
  } catch (error) {
    console.log('Error in getPostComments controller:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get single Comment
export const getSingleComment = async (req, res) => {
  const { commentId } = req.params;

  try {
    const comment = await Comment.findById(commentId)
      .populate('user', '-password')

      .populate({
        path: 'replies',
        populate: [
          {
            path: 'user',
            select: '-password',
          },
          {
            path: 'postId',
            populate: {
              path: 'user',
              select: 'username fullName profileImg',
            },
          },
        ],
      })
      .populate({
        path: 'parentId',
        populate: {
          path: 'user',
          select: '-password',
        },
      });

    //Check if the comment has a parent comment
    let currentComment = comment;
    while (currentComment.parentId) {
      //Populate the parentId of the current comment recursively
      currentComment = await Comment.populate(currentComment, {
        path: 'parentId',
        populate: {
          path: 'user',
          select: 'fullName username profileImg',
        },
      });

      currentComment = currentComment.parentId;
    }

    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    return res.status(200).json(comment);
  } catch (error) {
    console.log('Error in getSingleComment controller', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
//Get user Replies
export const getUserReplies = async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 10 } = req.query; // 解析分页参数

  try {
    const userReplies = await Comment.find({
      user: userId,
      isDeleted: { $ne: true },
    })
      .populate({
        path: 'user',
        select: 'username fullName profileImg',
      })

      .populate({
        path: 'replies',
        match: { isDeleted: { $ne: true } },
        populate: {
          path: 'user',
          select: 'username fullName profileImg',
        },
      })
      .populate({
        path: 'postId',
        populate: {
          path: 'user',
          select: 'username fullName profileImg',
        },
      })

      .sort({ createdAt: -1 }) // 按创建时间倒序排序
      .skip((page - 1) * limit) // 跳过前面的评论
      .limit(limit); // 限制返回的评论数量

    // 递归填充父评论
    for (let reply of userReplies) {
      let currentComment = reply;
      while (currentComment.parentId) {
        currentComment = await Comment.populate(currentComment, {
          path: 'parentId',
          populate: [
            {
              path: 'user',
              select: 'fullName username profileImg',
            },
            {
              path: 'likes', // Assuming 'likes' is a reference to another model
            },
          ],
        });
        currentComment = currentComment.parentId;
      }
    }

    const totalReplies = await Comment.countDocuments({
      user: userId,
      isDeleted: { $ne: true },
    });

    const totalPages = Math.ceil(totalReplies / limit);

    res.status(200).json({
      replies: userReplies,
      currentPage: parseInt(page), // 确保当前页正确返回
      totalPages,
    });
  } catch (error) {
    console.log('Error in getUserReplies controller:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
//Post comment on post
export const commentOnPost = async (req, res) => {
  try {
    const { text, imgs } = req.body;
    const postId = req.params.id;
    const userId = req.user._id;

    if (!text && (!imgs || imgs.length === 0)) {
      return res.status(400).json({ error: 'Post must have text or images' });
    }

    if (imgs && imgs.length > 4) {
      return res
        .status(400)
        .json({ error: 'You can upload a maximum of 4 images ' });
    }

    let uploadedImages = [];

    if (imgs && imgs.length > 0) {
      for (const img of imgs) {
        const uploadedResponse = await cloudinary.uploader.upload(img);
        uploadedImages.push(uploadedResponse.secure_url);
      }
    }
    const post = await Post.findById(postId);

    if (!post) return res.status(400).json({ message: 'Post not found' });

    const comment = new Comment({
      user: userId,
      text,
      imgs: uploadedImages,
      postId,
    });

    await comment.save();

    post.comments.push(comment._id);
    await post.save();

    await comment.populate('user', 'fullName username profileImg');

    res.status(200).json(comment);
  } catch (error) {
    console.log('Error in commentOnPost controller', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Reply to a comment
export const replyToComment = async (req, res) => {
  try {
    const { text, imgs = [] } = req.body;
    const commentId = req.params.id; // 父评论的ID
    const userId = req.user._id;

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

    const parentComment = await Comment.findById(commentId).populate('postId');
    if (!parentComment)
      return res.status(404).json({ message: 'Parent comment not found' });

    const reply = new Comment({
      user: userId,
      text,
      imgs: uploadedImages,
      parentId: commentId,
      postId: parentComment.postId,
    });
    await reply.save();

    parentComment.replies.push(reply._id);
    await parentComment.save();

    await reply.populate('user', 'fullName username profileImg');

    res.status(200).json(reply);
  } catch (error) {
    console.log('Error in replyToComment controller:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

//Delete comment
export const deleteComment = async (req, res) => {
  const userId = req.user._id;

  try {
    // Find the comment to be deleted
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found!' });
    }

    // Verify that the user has permission to delete the comment
    if (comment.user._id.toString() !== userId.toString()) {
      return res
        .status(401)
        .json({ message: 'You do not have permission to delete this comment' });
    }

    // If the comment has a parent comment, update the parent comment's replies field
    if (comment.parentId) {
      const parentComment = await Comment.findById(comment.parentId);
      if (parentComment) {
        parentComment.replies = parentComment.replies.filter(
          (replyId) => replyId.toString() !== comment._id.toString()
        );
        await parentComment.save();
      }
    }

    // Mark the comment as deleted
    comment.isDeleted = true;
    await comment.save();

    res.status(200).json({
      message:
        'Comment successfully marked as deleted, child comments retained',
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const likeUnlikeComment = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id: commentId } = req.params;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Check if the user has already liked the comment
    const userLikedComment = await User.findOne({
      _id: userId,
      'likes.item': commentId,
      'likes.onModel': 'Comment',
    });

    if (userLikedComment) {
      // Unlike the comment
      await Comment.updateOne({ _id: commentId }, { $pull: { likes: userId } });

      // Remove from user's likes array
      await User.updateOne(
        { _id: userId },
        { $pull: { likes: { item: commentId, onModel: 'Comment' } } }
      );

      const updatedComment = await Comment.findById(commentId);
      return res.status(200).json({
        message: 'Comment unliked successfully',
        likes: updatedComment.likes,
      });
    } else {
      // Like the comment
      comment.likes.push(userId);
      await User.updateOne(
        { _id: userId },
        { $push: { likes: { item: commentId, onModel: 'Comment' } } }
      );
      await comment.save();

      const notification = new Notification({
        from: userId,
        to: comment.user,
        type: 'likes',
      });
      await notification.save();

      return res.status(200).json({
        message: 'Comment liked successfully',
        likes: comment.likes,
      });
    }
  } catch (error) {
    console.log('Error in likeUnlikeComment controller:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const bookmarkComment = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id: commentId } = req.params;

    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    // Check if the user has already liked the comment
    const userLikedComment = await User.findOne({
      _id: userId,
      'bookmarks.item': commentId,
      'bookmarks.onModel': 'Comment',
    });
    if (userLikedComment) {
      await Comment.updateOne(
        { _id: commentId },
        { $pull: { bookmarks: userId } }
      );

      // Remove from user's bookmarks array
      await User.updateOne(
        { _id: userId },
        { $pull: { bookmarks: { item: commentId, onModel: 'Comment' } } }
      );
      const updatedComment = await Comment.findById(commentId);
      return res.status(200).json({
        message: 'Comment UnMark successfully',
        bookmarks: updatedComment.bookmarks,
      });
    } else {
      // Like the comment
      comment.bookmarks.push(userId);
      await User.updateOne(
        { _id: userId },
        { $push: { bookmarks: { item: commentId, onModel: 'Comment' } } }
      );

      return res.status(200).json({
        message: 'Comment bookmarked successfully',
        bookmarks: comment.bookmarks,
      });
    }
  } catch (error) {
    console.log('Error in bookmarksComment controller:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
