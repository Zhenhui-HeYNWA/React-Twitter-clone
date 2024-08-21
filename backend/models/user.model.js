import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: [],
      },
    ],
    followings: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: [],
      },
    ],
    profileImg: {
      type: String,
      default: '',
    },
    coverImg: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      default: '',
    },
    link: {
      type: String,
      default: '',
    },
    likes: [
      {
        item: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          refPath: 'likes.onModel',
        },
        onModel: {
          type: String,
          required: true,
          enum: ['Post', 'Comment'],
        },
      },
    ],
    bookmarks: [
      {
        item: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          refPath: 'bookmarks.onModel',
        },
        onModel: {
          type: String,
          required: true,
          enum: ['Post', 'Comment'],
        },
      },
    ],
    repostedPosts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        default: [],
      },
    ],
    userPosts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        default: [],
      },
    ],
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);

export default User;
