import Post from '../models/post.model.js';
import User from '../models/user.model.js';
import Comment from '../models/comment.model.js';

//Get Post Top level comments
export const getPostComments = async (req, res) => {
  const { id: postId } = req.params;

  try {
    const post = await Post.findById(postId).populate({
      path: 'comments',
      // Get only Top level comments
      match: { parentId: null, isDeleted: { $ne: true } }, // Filter out deleted comments
      populate: {
        path: 'user',
        select: '-password',
      },
      options: {
        sort: { createdAt: -1 },
      },
    });

    if (!post) {
      return res.status(404).json({
        error: 'Post not found',
      });
    }

    res.status(200).json(post.comments);
  } catch (error) {
    console.log('Error in getPostComments controller', error);
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
        populate: {
          path: 'user',
          select: '-password',
        },
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

  try {
    // Find all comments made by the user where isDeleted is not true
    const userReplies = await Comment.find({
      user: userId,
      isDeleted: { $ne: true },
    })
      .populate({
        path: 'user',
        select: '-password', // Populate the user details for each comment, excluding the password
      })
      .populate({
        path: 'replies',
        match: { isDeleted: { $ne: true } },
        populate: {
          path: 'user',
          select: '-password', // Populate the user details for each reply, excluding the password
        },
      });

    res.status(200).json(userReplies);
  } catch (error) {
    console.log('Error in getUserReplies controller:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
//Post comment on post
export const commentOnPost = async (req, res) => {
  try {
    const { text } = req.body;
    const postId = req.params.id;
    const userId = req.user._id;

    if (!text) return res.status(400).json({ error: 'Text field is required' });

    const post = await Post.findById(postId);

    if (!post) return res.status(400).json({ message: 'Post not found' });

    const comment = new Comment({ user: userId, text, postId }); // 将 postId 存入评论中
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
    const { text } = req.body;
    const commentId = req.params.id; // 父评论的ID
    const userId = req.user._id;

    if (!text) return res.status(400).json({ error: 'Text field is required' });

    const parentComment = await Comment.findById(commentId).populate('postId');
    if (!parentComment)
      return res.status(404).json({ message: 'Parent comment not found' });

    const reply = new Comment({
      user: userId,
      text,
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
