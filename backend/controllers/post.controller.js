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
    res.status(201).json(newPost);
  } catch (error) {
    console.log('error in createPost controller', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: '帖子未找到' });
    }
    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: '你没有权限删除此帖子' });
    }

    if (post.img) {
      const imgId = post.img.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(imgId);
    }

    // 如果帖子是转发帖，则更新原始帖子的转发数和所有相关转发帖子的转发数
    if (post.repost && post.repost.originalPost) {
      const originalPostId = post.repost.originalPost;

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
    }

    await Post.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: '帖子已从数据库中删除' });
  } catch (error) {
    console.log('deletePost 控制器错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
};
export const commentOnPost = async (req, res) => {
  try {
    const { text } = req.body;
    const postId = req.params.id;
    const userId = req.user._id;

    if (!text) {
      return res.status(400).json({ error: 'Text field is required' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = { user: userId, text };

    post.comments.push(comment);
    await post.save();

    const updatedComments = post.comments;

    res.status(200).json(updatedComments);
  } catch (error) {
    console.log('Error in commentOnPost controller:', error);
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
    const { id: postId } = req.params; // ID of the post to be reposted
    const userId = req.user._id; // Current user's ID

    // Find the post being reposted
    const repostPost = await Post.findById(postId).populate(
      'user',
      'username fullName profileImg'
    );
    if (!repostPost) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Get the ID of the original post
    const originalPostId = repostPost.repost?.originalPost || postId;

    // Find the original post
    const originalPost = await Post.findById(originalPostId);
    if (!originalPost) {
      return res.status(404).json({ message: 'Original post not found' });
    }

    // Get the user information of the original post
    const originalUser = await User.findById(originalPost.user);
    if (!originalUser) {
      return res.status(404).json({ message: 'Original post user not found' });
    }

    // Check if the current user has already reposted the original post
    const existingRepost = await Post.findOne({
      'repost.originalPost': originalPostId,
      user: userId,
    });

    if (existingRepost) {
      // If repost already exists, remove it
      await Post.findByIdAndDelete(existingRepost._id);

      // Update the repost count of the original post
      await Post.findByIdAndUpdate(originalPostId, {
        $inc: { repostByNum: -1 }, // Decrease repost count
        $pull: { repostBy: userId }, // Remove the current user from the repostBy list
      });

      // Update the repost count of all related reposts
      const updateRelatedPosts = async (postId) => {
        const relatedPosts = await Post.find({ 'repost.originalPost': postId });
        for (const post of relatedPosts) {
          await Post.findByIdAndUpdate(post._id, {
            $set: {
              'repost.repostNum': (
                await Post.findById(post.repost.originalPost)
              ).repostByNum, // Set repostNum to the repostByNum of the original post
            },
          });
          await updateRelatedPosts(post._id); // Recursively update related posts
        }
      };

      await updateRelatedPosts(originalPostId);

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
      repostBy: [userId], // Add the current user to the repostBy list
    });

    await newRepost.save();

    // Update the repost count of the original post
    await Post.findByIdAndUpdate(originalPostId, {
      $inc: { repostByNum: 1 }, // Increase repost count
      $addToSet: { repostBy: userId }, // Add the current user to the repostBy list if not already present
    });

    // Update the repost count of all related reposts
    const updateRelatedPosts = async (postId) => {
      const relatedPosts = await Post.find({ 'repost.originalPost': postId });
      for (const post of relatedPosts) {
        await Post.findByIdAndUpdate(post._id, {
          $set: {
            'repost.repostNum': (
              await Post.findById(post.repost.originalPost)
            ).repostByNum, // Set repostNum to the repostByNum of the original post
          },
        });
        await updateRelatedPosts(post._id); // Recursively update related posts
      }
    };

    await updateRelatedPosts(originalPostId);

    res.status(201).json(newRepost); // Respond with the newly created repost
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
        path: 'comments.user',
        select: '-password',
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
        path: 'comments.user',
        select: '-password',
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
        path: 'comments.user',
        select: '-password',
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
        path: 'comments.user',
        select: '-password',
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
        path: 'comments.user',
        select: '-password',
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
    const post = await Post.findById(postId).populate('user', '-password'); // populate post user without password

    if (!post) return res.status(404).json({ error: 'Post not found' });

    res.status(200).json(post);
  } catch (error) {
    console.log('Error in getSinglePost controller:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getPostComments = async (req, res) => {
  const { id: postId } = req.params;

  try {
    const post = await Post.findById(postId)
      .select('comments') // select only comments field
      .populate({
        path: 'comments.user',
        select: '-password', // populate user without password
      });

    if (!post) return res.status(404).json({ error: 'Post not found' });

    res.status(200).json(post.comments);
  } catch (error) {
    console.log('Error in getPostComments controller:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
