import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import {
  FaArrowLeft,
  FaBookmark,
  FaRegBookmark,
  FaRegHeart,
  FaTrash,
} from 'react-icons/fa';
import { Link, useParams } from 'react-router-dom';
import usePostMutations from '../../hooks/usePostMutations';
import { formatPostDate } from '../../utils/date';
import { BiComment, BiRepost } from 'react-icons/bi';
import PostSkeleton from '../skeletons/PostSkeleton';
import LoadingSpinner from './LoadingSpinner';
import { CiImageOn } from 'react-icons/ci';
import { BsEmojiSmileFill } from 'react-icons/bs';
import CommentSkeleton from '../skeletons/CommentSkeleton';
import userHighlightMentions from '../../hooks/userHighlightMentions';

import RenderComments from './RenderComments';
import RenderSubComments from './RenderSubComments';
import SingleCommentSkeleton from '../skeletons/SingleCommentSkeleton';
import useCommentMutations from '../../hooks/useCommentMutations';

const CommentPage = () => {
  const { data: authUser } = useQuery({
    queryKey: ['authUser'],
  });
  const [comment, setComment] = useState('');
  const [replyToPost, setReplyToPost] = useState('');
  const [showNav, setShowNav] = useState(false);
  const [isRepostedByAuthUser, setIsRepostedByAuthUser] = useState(false);

  const { username, postId, commentId } = useParams();

  const radioRef = useRef(null);

  // Fetch post data
  const { data: post, isLoading: isPostLoading } = useQuery({
    queryKey: ['post', postId],
    queryFn: async () => {
      const res = await fetch(`/api/posts/${username}/status/${postId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      return data;
    },
  });

  //Post checked
  const isMyPost = authUser._id === post?.user._id;
  const isLiked = post ? post.likes.includes(authUser._id) : false;
  const isMarked = post ? post.bookmarks.includes(authUser._id) : false;
  const isAuthUserRepost = post?.user._id === authUser._id;
  const isOriginalPost = post?.repost?.originalPost == null;

  const formattedPostDate = post ? formatPostDate(post.createdAt) : '';

  const { data: postComment } = useQuery({
    queryKey: ['comment', commentId],
    queryFn: async () => {
      const res = await fetch(
        `/api/comments/${postId}/comment/${username}/${commentId}`
      );
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      return data;
    },
  });

  useEffect(() => {
    if (authUser) {
      // Find the original post ID (if it's a repost)
      const originalPostId = post?.repost?.originalPost || post?._id;

      // Check if the current user is in the list of users who reposted this post
      const isReposted = authUser.repostedPosts.includes(originalPostId);
      setIsRepostedByAuthUser(isReposted);
    } else {
      setIsRepostedByAuthUser(false); // If there's no authenticated user, set the repost status to false by default
    }
  }, [authUser, post]);

  const handleTextareaClick = () => {
    setShowNav(true);
    if (radioRef.current) {
      radioRef.current.checked = true; // Simulate click to open accordion
    }
  };

  // Fetch comments data
  const { data: comments, isLoading: isCommentsLoading } = useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      const res = await fetch(
        `/api/comments/${username}/status/${postId}/comments`
      );
      const data = await res.json();
      console.log('data2', data);
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      return data;
    },
  });

  const CommentUsername = comments?.map((comment) => comment?.user?.username);

  //Post Mutations
  const {
    commentPostSimple,
    isCommenting,
    likePost,
    isLiking,
    bookmarkPost,
    isBookmarking,
    repostPost,
    isReposting,
    deletePost,
    isDeleting,
  } = usePostMutations(postId);

  //Comment Mutations
  const { replyComment, isReplying } = useCommentMutations();

  //Post:Delete
  const handleDeletePost = () => {
    if (isDeleting) return;
    deletePost;
  };

  //Post:CommentPost
  const handlePostCommentSubmit = (e) => {
    e.preventDefault();
    console.log(1);
    if (commentPostSimple.isLoading) return;
    commentPostSimple({ text: replyToPost });
    setComment('');
    const modal = document.getElementById('comments_modal' + postId);
    if (modal) {
      modal.close();
    }
  };

  //Post: LikePost
  const handleLikePost = () => {
    if (isLiking) return;
    likePost();
  };

  //Post: Bookmark Post
  const handleBookmarkingPost = () => {
    if (isBookmarking) return;
    bookmarkPost();
  };

  //Post: Repost Post
  const handleRepost = () => {
    if (isReposting) return;

    if (isRepostedByAuthUser) {
      repostPost({ actionType: 'remove' });
      return;
    }
    repostPost({ actionType: 'repost' });
    return;
  };

  //Comment: ReplyComment
  const handlePostReplyComment = (e) => {
    e.preventDefault();
    if (isReplying) return;

    replyComment({ commentId, text: comment });
    setComment('');

    const modal = document.getElementById(`comments_modal_${commentId}`);
    if (modal) {
      modal.close();
    }
  };

  return (
    <div className='flex-[4_4_0] border-r border-gray-200 dark:border-gray-700 min-h-screen  w-full  '>
      <div className='flex flex-col  '>
        {!isOriginalPost && !isAuthUserRepost && (
          <span className='px-14 flex text-slate-500 text-xs font-bold mt-2'>
            {' '}
            <BiRepost className='w-4 h-4  text-slate-500' />
            {post.user.username} reposted
          </span>
        )}

        {!isOriginalPost && isAuthUserRepost && (
          <span className='px-14 flex text-slate-500 text-xs font-bold mt-2'>
            {' '}
            <BiRepost className='w-4 h-4  text-slate-500' />
            You reposted
          </span>
        )}

        <div className='sticky top-0   z-10 w-full   backdrop-blur-2xl px-4 py-2 '>
          <div className='flex gap-10 px-4 py-1 items-center  '>
            <Link to='/'>
              <FaArrowLeft className='w-4 h-4' />
            </Link>
            <div className='flex flex-col'>
              <p className='font-bold text-lg'>Post</p>
            </div>
          </div>
        </div>
        <div className=''>
          <div className='post  hover:bg-slate-200   dark:hover:bg-inherit'>
            <div className='  flex flex-col w-full items-start py-1 px-4 justify-center  '>
              {isPostLoading && <PostSkeleton />}
              {!isPostLoading && !post && (
                <p className='text-center text-lg mt-4'>Post not found</p>
              )}

              {!isPostLoading && post && (
                <div className='flex flex-col w-full'>
                  <div className='flex flex-col gap-2 items-center justify-between  '>
                    <div className='flex  gap-4  w-full '>
                      <div className=' flex flex-col items-center '>
                        <div className='avatar'>
                          {/* Avatar */}
                          {isOriginalPost && (
                            <Link
                              to={`/profile/${post.user.username}`}
                              className='w-12 h-12 rounded-full overflow-hidden'>
                              <img
                                src={
                                  post.user.profileImg ||
                                  '/avatar-placeholder.png'
                                }
                                alt={`${post.user.profileImg}'s avatar`}
                              />
                            </Link>
                          )}
                          {!isOriginalPost && (
                            <Link
                              to={`/profile/${post.repost.postOwner?.username}`}
                              className='w-12 h-12 rounded-full overflow-hidden'>
                              <img
                                src={
                                  post.repost.postOwner?.profileImg ||
                                  '/avatar-placeholder.png'
                                }
                              />
                            </Link>
                          )}
                        </div>
                        <div className='w-0.5 dark:bg-slate-700  bg-gray-400  h-full mt-1'></div>
                      </div>

                      <div className='flex flex-col  w-full gap-2 '>
                        <div className='flex  items-center justify-between '>
                          <div className='flex flex-row items-center  justify-start gap-2 '>
                            {/* fullName */}
                            {isOriginalPost && (
                              <Link
                                to={`/profile/${post.user.username}`}
                                className='font-bold'>
                                {post.user.fullName}
                              </Link>
                            )}
                            {!isOriginalPost && (
                              <Link
                                to={`/profile/${post.repost.postOwner.username}`}
                                className='font-bold'>
                                {post.repost.postOwner.fullName}
                              </Link>
                            )}
                            {/* username */}
                            <span className='text-gray-700 flex gap-1 text-base'>
                              <Link
                                to={`/profile/${
                                  isOriginalPost
                                    ? post.user.username
                                    : post.repost.postOwner.username
                                }`}>
                                @
                                {isOriginalPost
                                  ? post.user.username
                                  : post.repost.postOwner.username}
                              </Link>
                            </span>
                            <span className='text-base  text-gray-700'>·</span>
                            <span className='text-base  text-gray-700 flex gap-1'>
                              {formattedPostDate}
                            </span>
                          </div>
                          {/* delete post */}
                          {isMyPost && (
                            <div className=' flex justify-end items-center'>
                              <span className='flex justify-end flex-1'>
                                {!isDeleting && (
                                  <FaTrash
                                    className='cursor-pointer hover:text-red-500'
                                    onClick={handleDeletePost}
                                  />
                                )}
                                {isDeleting && <LoadingSpinner size='sm' />}
                              </span>
                            </div>
                          )}
                        </div>
                        {/* post text */}
                        <div className='flex flex-col overflow-hidden  '>
                          {isOriginalPost && (
                            <span className='text-lg'>
                              {userHighlightMentions(post.text, post.user.name)}
                            </span>
                          )}
                          {!isOriginalPost && (
                            <span className='text-lg'>
                              {userHighlightMentions(
                                post.repost.originalText,
                                post.user.name
                              )}
                            </span>
                          )}

                          {isOriginalPost && post.img && (
                            <img
                              src={post.img}
                              className='h-80 object-cover rounded-lg border border-gray-700 mt-2'
                              alt=''
                            />
                          )}
                          {!isOriginalPost && post.repost.originalImg && (
                            <img
                              src={post.repost.originalImg}
                              className='h-80 object-fit rounded-lg border border-gray-700 mt-2'
                              alt=''
                            />
                          )}
                        </div>
                        {/* post functions */}
                        <div className='flex flex-row items-center  justify-between'>
                          <div
                            className='flex gap-1 items-center cursor-pointer group'
                            onClick={() =>
                              document
                                .getElementById('comments_modal' + post?._id)
                                .showModal()
                            }>
                            {isCommenting && <LoadingSpinner size='sm' />}
                            {!isCommenting && (
                              <>
                                {' '}
                                <BiComment className='w-4 h-4 text-slate-500 group-hover:text-sky-400' />
                                <span className='text-sm text-slate-500 group-hover:text-sky-400'>
                                  {comments?.length}
                                </span>{' '}
                              </>
                            )}
                          </div>
                          <dialog
                            id={`comments_modal${post?._id}`}
                            className='modal border-none outline-none'>
                            <div className='modal-box rounded border bg-gray-100 dark:bg-[#15202B]  border-gray-600'>
                              <h3 className='font-bold text-lg mb-4'>
                                COMMENTS
                              </h3>
                              <div className='flex flex-col gap-3 max-h-60 overflow-auto'>
                                {post?.comments.length === 0 && (
                                  <p className='text-sm text-slate-500'>
                                    No comments yet 🤔 Be the first one 😉
                                  </p>
                                )}
                                {comments?.map((comment) => (
                                  <div
                                    key={comment?._id}
                                    className='flex gap-2 items-start'>
                                    <div className='avatar'>
                                      <div className='w-8 rounded-full'>
                                        <img
                                          src={
                                            comment.user?.profileImg ||
                                            '/avatar-placeholder.png'
                                          }
                                        />
                                      </div>
                                    </div>
                                    <div className='flex flex-col'>
                                      <div className='flex items-center gap-1'>
                                        <span className='font-bold'>
                                          {comment.user?.fullName}
                                        </span>
                                        <span className='text-gray-700 text-sm'>
                                          @{comment.user?.username}
                                        </span>
                                      </div>
                                      <div className='text-sm'>
                                        {comment?.text}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <form
                                className='flex gap-2 items-center mt-4 border-t border-gray-300  dark:bg-[#15202B]  pt-2'
                                onSubmit={(e) =>
                                  handlePostCommentSubmit(e, commentId)
                                }>
                                <textarea
                                  className='textarea w-full p-1 rounded text-md resize-none border focus:outline-none  bg-gray-100 dark:bg-[#15202B] border-gray-100  dark:border-secondary'
                                  placeholder='Add a comment...'
                                  value={replyToPost}
                                  onChange={(e) =>
                                    setReplyToPost(e.target.value)
                                  }
                                />
                                <button className='btn btn-primary rounded-full btn-sm text-white px-4'>
                                  {handlePostCommentSubmit.isCommenting ? (
                                    <span className=' flex  gap-1 items-center disabled'>
                                      Posting <LoadingSpinner size='md' />
                                    </span>
                                  ) : (
                                    'Post'
                                  )}
                                </button>
                              </form>
                            </div>
                            <form method='dialog' className='modal-backdrop'>
                              <button className='outline-none'>close</button>
                            </form>
                          </dialog>

                          <div className='dropdown dropdown-top '>
                            <div
                              tabIndex={0}
                              role={`${isRepostedByAuthUser ? 'button' : ''}`}
                              className={`flex  gap-1 items-center group cursor-pointer  
                  
                      btn rounded-none  btn-ghost btn-xs  p-0 border-none hover:bg-inherit
                  
                   `}
                              onClick={
                                !isRepostedByAuthUser ? handleRepost : undefined
                              }>
                              {isRepostedByAuthUser ? (
                                <ul
                                  tabIndex={0}
                                  className='dropdown-content menu bg-gray-100 dark:bg-secondary  border-gray-600 rounded-box z-[1] w-52 p-2 shadow  '>
                                  <li onClick={handleRepost}>
                                    <button className='text-red-500'>
                                      Undo repost
                                    </button>
                                  </li>
                                </ul>
                              ) : (
                                ''
                              )}

                              {isReposting && <LoadingSpinner size='sm' />}

                              {isOriginalPost && (
                                <>
                                  {!isReposting && (
                                    <BiRepost
                                      className={`w-6 h-6 ${
                                        isRepostedByAuthUser
                                          ? ' text-green-500 group-hover:text-red-600'
                                          : ' text-slate-500 group-hover:text-green-500'
                                      }`}
                                    />
                                  )}
                                  <span
                                    className={`text-sm ${
                                      isRepostedByAuthUser
                                        ? ' text-green-500 group-hover:text-red-600'
                                        : ' text-slate-500 group-hover:text-green-500'
                                    }`}>
                                    {post?.repostByNum}
                                  </span>
                                </>
                              )}
                              {!isOriginalPost && (
                                <>
                                  {!isReposting && (
                                    <BiRepost
                                      className={`w-6 h-6 ${
                                        isRepostedByAuthUser
                                          ? ' text-green-500 group-hover:text-red-600'
                                          : ' text-slate-500 group-hover:text-green-500'
                                      }`}
                                    />
                                  )}

                                  <span
                                    className={`text-sm ${
                                      isRepostedByAuthUser
                                        ? ' text-green-500 group-hover:text-red-600'
                                        : ' text-slate-500 group-hover:text-green-500'
                                    }`}>
                                    {post.repost.repostNum}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* like post  */}
                          <div
                            className='flex gap-1 items-center group cursor-pointer'
                            onClick={handleLikePost}>
                            {isLiking && <LoadingSpinner size='sm' />}
                            {!isLiked && !isLiking && (
                              <FaRegHeart className='w-4 h-4 cursor-pointer text-slate-500 group-hover:text-pink-500' />
                            )}
                            {isLiked && !isLiking && (
                              <FaRegHeart className='w-4 h-4 cursor-pointer text-pink-500 ' />
                            )}

                            <span
                              className={`text-sm  group-hover:text-pink-500 ${
                                isLiked ? 'text-pink-500' : 'text-slate-500'
                              }`}>
                              {post?.likes.length}
                            </span>
                          </div>

                          {/* bookmark */}
                          <div
                            className='flex gap-2 group items-center'
                            onClick={handleBookmarkingPost}>
                            {isBookmarking && <LoadingSpinner size='sm' />}
                            {!isMarked && !isBookmarking && (
                              <FaRegBookmark className='w-4 h-4 text-slate-500 cursor-pointer group-hover:fill-black' />
                            )}
                            {isMarked && !isBookmarking && (
                              <FaBookmark className='w-4 h-4 cursor-pointer  ' />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className='px-4'>
            {/* Comment section */}
            {isCommentsLoading ? (
              <>
                <SingleCommentSkeleton />
                <CommentSkeleton />
              </>
            ) : (
              <RenderComments
                comment={postComment}
                isLoading={isCommentsLoading}
              />
            )}
          </div>
        </div>

        {/* CREATE COMMENT */}
        <div className='transition-all duration-1000 ease-in-out'>
          <div
            className={` hidden md:flex px-16  justify-start items-center text-slate-500 transition-opacity duration-300 ease-in-out ${
              showNav ? 'opacity-100' : 'opacity-0'
            }`}>
            Replying to
            <p className='text-sky-500'>
              @{post?.user.username}, {CommentUsername}
            </p>
          </div>

          <div className='hidden md:flex items-start gap-4 border-b border-gray-200 dark:border-gray-700 mb-2 px-4'>
            <div className='avatar flex'>
              <div className='w-12 h-12 rounded-full'>
                <img
                  src={authUser?.profileImg || '/avatar-placeholder.png'}
                  alt='Profile'
                  className='transition-all duration-300 ease-in-out'
                />
              </div>
            </div>
            <form
              className={`flex gap-2 w-full ${
                showNav ? 'flex-col' : 'flex-row'
              }`}
              onSubmit={handlePostReplyComment}>
              <textarea
                className='group textarea w-full p-0 text-2xl resize-none border-none focus:outline-none bg-inherit'
                placeholder='Post your reply'
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onClick={handleTextareaClick}
              />

              <div className='flex flex-row justify-between'>
                <div
                  className={`flex justify-between py-2 transition-all duration-1000 ease-in-out ${
                    showNav
                      ? 'flex-row opacity-100 max-h-full'
                      : 'flex-row-reverse opacity-0 max-h-0'
                  }`}>
                  <div className='nav flex gap-1 items-center'>
                    <CiImageOn className='fill-primary w-6 h-6 cursor-pointer transition-all duration-1000 ease-in-out' />
                    <BsEmojiSmileFill className='fill-primary w-5 h-5 cursor-pointer transition-all duration-1000 ease-in-out' />
                  </div>
                  <input type='file' hidden accept='image/*' />
                </div>
                <button
                  disabled={isReplying}
                  className='btn btn-primary rounded-full btn-sm text-white px-4'>
                  {isReplying ? 'Replying' : 'Reply'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* SubComment sections */}
        {/* POST COMMENT */}
        {isCommentsLoading && (
          <>
            <CommentSkeleton />
            <CommentSkeleton />
            <CommentSkeleton />
          </>
        )}

        {!isCommentsLoading &&
          postComment?.replies.map((reply) => {
            return (
              <div
                key={reply._id}
                className=' border-b-2  border-gray-200 dark:border-gary-700 hover:bg-slate-200 dark:hover:bg-inherit'>
                <RenderSubComments postComment={reply} />
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default CommentPage;
