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
    imgs: [
      {
        type: String,
      },
    ],
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
        refPath: 'repost.onModel', // 动态引用 `Post` 或 `Comment`
      },
      postOwner: {
        _id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        username: { type: String },
        fullName: { type: String },
        profileImg: { type: String },
      },
      originalText: { type: String },
      originalImgs: [{ type: String }],
      repostUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      repostNum: { type: Number, default: 0 },
      commentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },

      onModel: {
        type: String,
        enum: ['Post', 'Comment'], // 可以是 'Post' 或 'Comment'
      },
      replyToUser: {
        _id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // 用户的 ID
        username: { type: String },
        fullName: { type: String },
        profileImg: { type: String },
      },
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
      originalImgs: [{ type: String }],
      originalCreatedAt: { type: Date },
      commentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
      onModel: {
        type: String,
        enum: ['Post', 'Comment'], // 可以是 'Post' 或 'Comment'
      },
      replyToUser: {
        _id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // 用户的 ID
        username: { type: String },
        fullName: { type: String },
        profileImg: { type: String },
      },
    },

    postLocation: {
      type: String,
    },
  },
  { timestamps: true }
);
const Post = mongoose.model('Post', postSchema);

export default Post;
