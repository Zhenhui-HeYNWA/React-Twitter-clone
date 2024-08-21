import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
    },
    replies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
      },
    ],
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: [],
      },
    ],
    bookmarks:[
      {
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        default:[]
      }
    ],
    isDeleted: { type: Boolean, default: false },
  },

  { timestamps: true }
);

const Comment = mongoose.model('Comment', commentSchema);

export default Comment;
