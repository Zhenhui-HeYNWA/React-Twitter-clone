import { useQuery } from '@tanstack/react-query';
import { BiComment, BiRepost } from 'react-icons/bi';
import {
  FaArrowLeft,
  FaBookmark,
  FaRegBookmark,
  FaRegHeart,
  FaTrash,
} from 'react-icons/fa';
import { Link, useParams } from 'react-router-dom';
import { formatDateTime } from '../../utils/date';
import { useEffect, useState } from 'react';
import PostSkeleton from '../skeletons/PostSkeleton';
import CommentSkeleton from '../skeletons/CommentSkeleton';

import usePostMutations from '../../hooks/usePostMutations';
import LoadingSpinner from './LoadingSpinner';
import RenderSubComments from './RenderSubComments';
import CreateCommentForm from './CreateCommentForm';

const SinglePost = () => {
  const { data: authUser } = useQuery({
    queryKey: ['authUser'],
  });
  const { username, postId } = useParams();
  // Fetch post data
  const { data: post, isLoading: isPostLoading } = useQuery({
    queryKey: ['post', postId],
    queryFn: async () => {
      const res = await fetch(`/api/posts/${username}/status/${postId}`);
      const data = await res.json();
      console.log(data);
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      return data;
    },
  });

  const [comment, setComment] = useState('');

  const isMyPost = authUser._id === post?.user._id;

  const [isRepostedByAuthUser, setIsRepostedByAuthUser] = useState(false);
  const isAuthUserRepost = post?.user._id === authUser._id;

  console.log(post);

  const isOriginalPost = post?.repost?.originalPost == null;
  useEffect(() => {
    if (authUser) {
      // 查找源帖子 ID（如果是转发的帖子）
      const originalPostId = post?.repost?.originalPost || post?._id;

      // 检查当前用户是否在转发列表中
      const isReposted = authUser.repostedPosts.includes(originalPostId);
      setIsRepostedByAuthUser(isReposted);
    } else {
      setIsRepostedByAuthUser(false); // 如果没有 authUser, 默认设置为 false
    }
  }, [authUser, post]);

  // Fetch comments data
  const { data: comments, isLoading: isCommentsLoading } = useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      const res = await fetch(
        `/api/comments/${username}/status/${postId}/comments`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      return data;
    },
  });

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

  const isLiked = post ? post.likes.includes(authUser._id) : false;
  const isMarked = post ? post.bookmarks.includes(authUser._id) : false;

  const handleDeletePost = () => {
    if (isDeleting) return;
    deletePost;
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    console.log(1);
    if (isCommenting) return;
    commentPostSimple({ postId: postId, text: comment });
    setComment('');

    const modal = document.getElementById('comments_modal' + postId);
    if (modal) {
      modal.close();
    }
  };

  const handleLikePost = (postId) => {
    if (isLiking) return;
    likePost(postId);
  };
  const handleBookmarkingPost = () => {
    if (isBookmarking) return;
    bookmarkPost();
  };
  console.log(authUser);

  const handleRepost = () => {
    if (isReposting) return;

    if (isRepostedByAuthUser) {
      repostPost({ actionType: 'remove' });
      return;
    }
    repostPost({ actionType: 'repost' });
    return;
  };

  const highlightMentions = (text) => {
    const regex = /@\w+/g; // Regex to find mentions in the text
    return text.split(regex).map((part, index) => {
      const match = text.match(regex)?.[index];
      console.log(match);
      const username = match?.substring(1);
      console.log(username);
      if (match) {
        return (
          <>
            <span>
              {part}
              <Link key={index} to={`/profile/${username}`}>
                <span className='mention-highlight text-sky-500 hover:underline hover:text-sky-700'>
                  {match}
                </span>
              </Link>
            </span>
          </>
        );
      }
      return part;
    });
  };

  const formattedDate = post ? formatDateTime(post.createdAt) : '';

  return (
    <div className='flex-[4_4_0] border-r border-gray-200 dark:border-gray-700 min-h-screen w-full'>
      <div className='flex flex-col '>
        <div className='sticky top-0   z-10 w-full   backdrop-blur-2xl px-4 py-2 '>
          <div className='flex gap-10  py-1 items-center'>
            <Link to='/'>
              <FaArrowLeft className='w-4 h-4' />
            </Link>
            <div className='flex flex-col'>
              <p className='font-bold text-lg'>Post</p>
            </div>
          </div>
        </div>
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

        <div className='flex gap-2 items-start py-2 px-4 border-b border-gray-200 dark:border-gray-700 justify-center'>
          {isPostLoading && <PostSkeleton />}
          {!isPostLoading && !post && (
            <p className='text-center text-lg mt-4'>Post not found</p>
          )}

          {!isPostLoading && post && (
            <div className='flex flex-col flex-1'>
              <div className='flex flex-row gap-2 items-center justify-between'>
                <div className='flex  gap-4'>
                  <div className='avatar'>
                    {/* Avatar */}
                    {isOriginalPost && (
                      <Link
                        to={`/profile/${post.user.username}`}
                        className='w-12 h-12 rounded-full overflow-hidden'>
                        <img
                          src={
                            post.user.profileImg || '/avatar-placeholder.png'
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
                  <div className='flex flex-col justify-start'>
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

                    <span className='text-gray-500 flex gap-1 text-sm'>
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
                  </div>
                </div>
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
              <div className='flex flex-col gap-3 overflow-hidden mt-2'>
                {isOriginalPost && (
                  <span className='text-lg whitespace-pre-wrap word-wrap'>
                    {highlightMentions(post.text)}
                  </span>
                )}
                {!isOriginalPost && (
                  <span className='text-lg whitespace-pre-wrap word-wrap'>
                    {highlightMentions(post.repost.originalText)}
                  </span>
                )}

                {isOriginalPost && post.img && (
                  <img
                    src={post.img}
                    className='h-full object-cover object-center rounded-lg border border-gray-700 mt-2 w-[40rem]'
                    alt=''
                  />
                )}
                {!isOriginalPost && post.repost.originalImg && (
                  <img
                    src={post.repost.originalImg}
                    className='h-full object-cover object-center rounded-lg border border-gray-700 mt-2 w-[40rem]'
                    alt=''
                  />
                )}
              </div>
              <div className='text-sm mt-2 text-gray-500 flex gap-1'>
                {formattedDate}
              </div>
            </div>
          )}
        </div>
        <div className='flex justify-between my-1 px-5 md:px-14 border-b border-gray-200 dark:border-gray-700 py-2   '>
          <div className='flex gap-4 items-center justify-between w-full'>
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
              <div className='modal-box rounded border bg-gray-100 dark:bg-secondary  border-gray-600'>
                <h3 className='font-bold text-lg mb-4'>COMMENTS</h3>
                <div className='flex flex-col gap-3 max-h-60 overflow-auto'>
                  {post?.comments.length === 0 && (
                    <p className='text-sm text-slate-500'>
                      No comments yet 🤔 Be the first one 😉
                    </p>
                  )}
                  {comments?.map((comment) => (
                    <div key={comment?._id} className='flex gap-2 items-start'>
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
                            {comment?.isDeleted}
                          </span>
                        </div>
                        <div className='text-sm'>{comment?.text}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <form
                  className='flex gap-2 items-center mt-4 border-t border-gray-300  dark:border-gray-800  pt-2'
                  onSubmit={handleCommentSubmit}>
                  <textarea
                    className='textarea w-full p-1 rounded text-md resize-none border focus:outline-none  bg-gray-100 dark:bg-secondary border-gray-100  dark:border-gray-800'
                    placeholder='Add a comment...'
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                  <button className='btn btn-primary rounded-full btn-sm text-white px-4'>
                    {commentPostSimple.isCommenting ? (
                      <LoadingSpinner size='md' />
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
            <div className='dropdown dropdown-top'>
              <div
                tabIndex={0}
                role={`${isRepostedByAuthUser ? 'button' : ''}`}
                className={`flex gap-1 items-center group cursor-pointer  
                    
                        btn rounded-none  btn-ghost btn-xs  p-0 border-none hover:bg-inherit
                    
                     `}
                onClick={!isRepostedByAuthUser ? handleRepost : undefined}>
                {isRepostedByAuthUser ? (
                  <ul
                    tabIndex={0}
                    className='dropdown-content menu bg-gray-100 dark:bg-secondary  border-gray-600 rounded-box z-[1] w-52 p-2 shadow  '>
                    <li onClick={handleRepost}>
                      <button className='text-red-500'>Undo repost</button>
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
            <div
              className=' gap-2 group items-center'
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

        {/* CREATE COMMENT */}

        <CreateCommentForm
          post={post}
          authUser={authUser}
          type={'ReplyToPost'}
        />
        {/* POST COMMENT */}
        <div className=''>
          {isCommentsLoading ? (
            <>
              <CommentSkeleton />
              <CommentSkeleton />
            </>
          ) : (
            comments.map((comment) => {
              return (
                <div
                  key={comment?._id}
                  className='border-b border-gray-200 dark:border-gray-700  pt-2'>
                  <RenderSubComments postComment={comment} pageType={1} />
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default SinglePost;
