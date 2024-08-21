import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
    },
    img: {
      type: String,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: [],
      },
    ],
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
        default: [],
      },
    ],
    bookmarks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    repost: {
      originalPost: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
      },
      postOwner: {
        _id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        username: { type: String },
        fullName: { type: String },
        profileImg: { type: String },
      },
      originalText: { type: String },
      originalImg: { type: String },
      repostUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      repostNum: { type: Number, default: 0 },
    },
    repostByNum: { type: Number, default: 0 },
    repostBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    quote: {
      originalPost: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
      },
      originalUser: {
        _id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        username: { type: String },
        fullName: { type: String },
        profileImg: { type: String },
      },
      originalText: { type: String },
      originalImg: { type: String },
    },
  },
  { timestamps: true }
);

const Post = mongoose.model('Post', postSchema);

export default Post;
