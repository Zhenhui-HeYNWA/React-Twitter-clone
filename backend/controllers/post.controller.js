import Notification from '../models/notification.model.js';
import Post from '../models/post.model.js';
import User from '../models/user.model.js';
import { v2 as cloudinary } from 'cloudinary';

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
  const userId = req.user._id;
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post no found' });
    }
    if (post.user._id.toString() !== userId.toString()) {
      return res
        .status(401)
        .json({ message: 'You have no right to delete this post' });
    }

    if (post.img) {
      const imgId = post.img.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(imgId);
    }

    let originalPostId;

    // 如果帖子是转发帖，则更新原始帖子的转发数
    if (post.repost && post.repost.originalPost) {
      originalPostId = post.repost.originalPost;

      await Post.findByIdAndUpdate(originalPostId, {
        $inc: { repostByNum: -1 },
        $pull: { repostBy: post.user },
      });

      // 更新所有相关转发帖子的转发数量
      const updateRelatedPosts = async (postId) => {
        const relatedPosts = await Post.find({ 'repost.originalPost': postId });
        for (const post of relatedPosts) {
          await Post.findByIdAndUpdate(post._id, {
            $set: {
              'repost.repostNum': (
                await Post.findById(post.repost.originalPost)
              ).repostByNum,
            },
          });
          await updateRelatedPosts(post._id);
        }
      };

      await updateRelatedPosts(originalPostId);

      // 从所有转发该原始帖子的用户的repostedPosts字段中移除原始帖子ID
      await User.updateMany(
        { repostedPosts: originalPostId },
        { $pull: { repostedPosts: originalPostId } }
      );
    } else {
      // 如果帖子是原始帖子，直接从所有用户的repostedPosts字段中移除帖子ID
      originalPostId = req.params.id;

      await User.updateMany(
        { repostedPosts: originalPostId },
        { $pull: { repostedPosts: originalPostId } }
      );
    }

    // 删除帖子
    await Post.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: '帖子已从数据库中删除' });
  } catch (error) {
    console.log('deletePost 控制器错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
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

    const userLikedPost = post.likes.includes(userId);

    if (userLikedPost) {
      //Unlike post
      //fine the _id == postId, remove the userId from the likes array
      await Post.updateOne({ _id: postId }, { $pull: { likes: userId } });

      await User.updateOne({ _id: userId }, { $pull: { likedPosts: postId } });

      const updatedLikes = post.likes.filter(
        (id) => id.toString() !== userId.toString()
      );
      res.status(200).json(updatedLikes);
    } else {
      //like post
      post.likes.push(userId);
      await User.updateOne({ _id: userId }, { $push: { likedPosts: postId } });
      await post.save();

      const notification = new Notification({
        from: userId,
        to: post.user,
        type: 'likes',
      });
      await notification.save();
      const updatedLikes = post.likes;
      res.status(200).json(updatedLikes);
    }
  } catch (error) {
    console.log('Error in  likeUnlikePost controller:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const bookmarkUnBookmark = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id: postId } = req.params;

    const post = await Post.findById(postId);
    const user = await User.findById(userId);

    if (!post || !user) {
      return res.status(404).json({ error: 'Post or User not found' });
    }

    const userBookmarkedPost = post.bookmarks.includes(userId);

    if (userBookmarkedPost) {
      //Unbookmark post
      await Post.updateOne({ _id: postId }, { $pull: { bookmarks: userId } });
      await User.updateOne({ _id: userId }, { $pull: { bookmarks: postId } });

      const updatedBookmarks = post.bookmarks.filter(
        (id) => id.toString() !== userId.toString()
      );
      res.status(200).json(updatedBookmarks);
    } else {
      //BookMark post
      post.bookmarks.push(userId);
      await User.updateOne({ _id: userId }, { $push: { bookmarks: postId } });
      await post.save();

      const updatedBookmarks = post.bookmarks;
      res.status(200).json(updatedBookmarks);
    }
  } catch (error) {
    console.log('Error in bookmarkUnBookmarkPost controller:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const repostPost = async (req, res) => {
  try {
    const { id: postId } = req.params; // 转发的帖子ID
    const userId = req.user._id; // 当前用户ID

    // 查找转发的帖子
    const repostPost = await Post.findById(postId).populate(
      'user',
      'username fullName profileImg'
    );
    if (!repostPost) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // 获取原始帖子的ID
    const originalPostId = repostPost.repost?.originalPost || postId;

    // 查找原始帖子
    const originalPost = await Post.findById(originalPostId);
    if (!originalPost) {
      return res.status(404).json({ message: 'Original post not found' });
    }

    // 获取原始帖子的用户信息
    const originalUser = await User.findById(originalPost.user);
    if (!originalUser) {
      return res.status(404).json({ message: 'Original post user not found' });
    }

    // 检查当前用户是否已经转发了原始帖子
    const existingRepost = await Post.findOne({
      'repost.originalPost': originalPostId,
      user: userId,
    });

    if (existingRepost) {
      // 如果转发已经存在，则删除
      await Post.findByIdAndDelete(existingRepost._id);

      // 更新原始帖子的转发数量
      await Post.findByIdAndUpdate(originalPostId, {
        $inc: { repostByNum: -1 }, // 减少转发数量
        $pull: { repostBy: userId }, // 从 repostBy 列表中移除当前用户
      });

      // 更新所有相关转发帖子的转发数量
      const updateRelatedPosts = async (postId) => {
        const relatedPosts = await Post.find({ 'repost.originalPost': postId });
        for (const post of relatedPosts) {
          await Post.findByIdAndUpdate(post._id, {
            $set: {
              'repost.repostNum': (
                await Post.findById(post.repost.originalPost)
              ).repostByNum, // 设置 repostNum 为原始帖子的 repostByNum
            },
          });
          await updateRelatedPosts(post._id); // 递归更新相关帖子
        }
      };

      await updateRelatedPosts(originalPostId);

      // 从用户的 repostedPosts 中移除已删除的转发
      await User.findByIdAndUpdate(userId, {
        $pull: { repostedPosts: originalPostId }, // 这里需要移除原始帖子的 ID
      });

      return res.status(200).json({ message: 'Repost successfully removed' });
    }

    // 创建新的转发
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
        repostNum: 1, // 初始转发数量
      },
      repostBy: [userId], // 将当前用户添加到 repostBy 列表
    });

    await newRepost.save();

    // 更新原始帖子的转发数量
    await Post.findByIdAndUpdate(originalPostId, {
      $inc: { repostByNum: 1 }, // 增加转发数量
      $addToSet: { repostBy: userId }, // 将当前用户添加到 repostBy 列表中（如果尚未存在）
    });

    // 更新所有相关转发帖子的转发数量
    const updateRelatedPosts = async (postId) => {
      const relatedPosts = await Post.find({ 'repost.originalPost': postId });
      for (const post of relatedPosts) {
        await Post.findByIdAndUpdate(post._id, {
          $set: {
            'repost.repostNum': (
              await Post.findById(post.repost.originalPost)
            ).repostByNum, // 设置 repostNum 为原始帖子的 repostByNum
          },
        });
        await updateRelatedPosts(post._id); // 递归更新相关帖子
      }
    };

    await updateRelatedPosts(originalPostId);

    // 将转发的帖子ID添加到用户的 repostedPosts 中
    await User.findByIdAndUpdate(userId, {
      $addToSet: { repostedPosts: originalPostId }, // 确保 ID 唯一
    });

    res.status(201).json(newRepost); // 返回新创建的转发
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
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
    }

    const likedPosts = await Post.find({ _id: { $in: user.likedPosts } })
      .populate({ path: 'user', select: '-password' })
      .populate({
        path: 'comments',
        match: { isDeleted: { $ne: true } },
        populate: {
          path: 'user',
          select: '-password',
        },
      });

    res.status(200).json(likedPosts);
  } catch (error) {
    console.log('Error in getLikedPosts controller:', error);
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
