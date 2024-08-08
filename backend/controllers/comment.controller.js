import Post from '../models/post.model.js';
import User from '../models/user.model.js';
import Comment from '../models/comment.model.js';

//Get Post Top level comments
export const getPostComments = async (req, res) => {
  const { id: postId } = req.params;

  try {
    const post = await Post.findById(postId).populate({
      path: 'comments',
      //Get only Top level comments
      match: { parentId: null },
      populate: {
        path: 'user',
        select: '-password',
      },
      options: {
        sort: { createdAt: -1 },
      },
    });

    if (!post)
      return res.status(404).json({
        error: 'Post not found',
      });

    res.status(200).json(post.comments);
  } catch (error) {
    console.log('Error in getPost Comments controller', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get single Comment
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
