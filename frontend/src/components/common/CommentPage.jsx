import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { FaArrowLeft, FaTrash } from 'react-icons/fa';
import { Link, useParams } from 'react-router-dom';
import usePostMutations from '../../hooks/usePostMutations';
import { formatPostDate } from '../../utils/date';
import { BiRepost } from 'react-icons/bi';
import PostSkeleton from '../skeletons/PostSkeleton';

import CommentSkeleton from '../skeletons/CommentSkeleton';
import userHighlightMentions from '../../hooks/userHighlightMentions';

import RenderSubComments from './RenderSubComments';
import SingleCommentSkeleton from '../skeletons/SingleCommentSkeleton';

import CreateCommentForm from './CreateCommentForm';
import LoadingSpinner from './LoadingSpinner';
import RenderComments from './RenderComments';

import PostFunctions from './PostFunctions';

const CommentPage = () => {
  const { data: authUser } = useQuery({
    queryKey: ['authUser'],
  });

  const [isRepostedByAuthUser, setIsRepostedByAuthUser] = useState(false);

  const { username, postId, commentId } = useParams();

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

  const isAuthUserRepost = post?.user._id === authUser._id;
  const isOriginalPost = post?.repost?.originalPost == null;

  const formattedPostDate = post ? formatPostDate(post.createdAt) : '';

  const { data: postComment, isLoading: isPostCommentLoading } = useQuery({
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
  const getUniqueCommentUsernames = (arr) => [...new Set(arr)];

  const CommentUsername = getUniqueCommentUsernames(
    [...(comments?.map((comment) => comment?.user?.username) || [])].filter(
      Boolean
    )
  );

  const { deletePost, isDeleting } = usePostMutations(postId);

  //Post:Delete
  const handleDeletePost = () => {
    if (isDeleting) return;
    deletePost;
  };

  return (
    <div className='flex-[4_4_0] border-r border-gray-200 dark:border-gray-700 min-h-screen  w-full '>
      <div className='sticky top-0   z-10 w-full   backdrop-blur-2xl px-4 py-2 '>
        <div className='flex gap-10 px-4 pt-1 items-center  '>
          <Link to='/'>
            <FaArrowLeft className='w-4 h-4' />
          </Link>
          <div className='flex flex-col'>
            <p className='font-bold text-lg'>Post</p>
          </div>
        </div>
      </div>
      <div className='flex flex-col  '>
        <div className=''>
          {/* Post Sections */}
          <div className='post  hover:bg-slate-200   dark:hover:bg-inherit '>
            <div className='  flex flex-col w-full items-start pt-1 px-4 justify-center  '>
              {isPostLoading && <PostSkeleton />}
              {!isPostLoading && !post && (
                <p className='text-center text-lg mt-4'>Post not found</p>
              )}
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

                      <div className='flex flex-col  w-full gap-1  '>
                        <div className='flex  items-center justify-between  w-full '>
                          <div className='flex flex-row items-center  justify-start gap-1 '>
                            {/* fullName */}
                            {isOriginalPost && (
                              <Link
                                to={`/profile/${post.user.username}`}
                                className='font-bold truncate'>
                                {post.user.fullName}
                              </Link>
                            )}
                            {!isOriginalPost && (
                              <Link
                                to={`/profile/${post.repost.postOwner.username}`}
                                className='font-bold text-nowrap'>
                                {post.repost.postOwner.fullName}
                              </Link>
                            )}
                            {/* username */}
                            <span className='text-gray-500 text-base truncate max-w-20 md:max-w-52'>
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
                            <span className='text-base  text-gray-500 text-nowrap'>
                              ·
                            </span>
                            <span className='text-base  text-gray-500  text-nowrap'>
                              {formattedPostDate}
                            </span>
                          </div>
                          <div className=' flex justify-end items-center'>
                            {/* delete post */}
                            {isMyPost && (
                              <span className='flex justify-end flex-1'>
                                {!isDeleting && (
                                  <FaTrash
                                    className='cursor-pointer hover:text-red-500'
                                    onClick={handleDeletePost}
                                  />
                                )}
                                {isDeleting && <LoadingSpinner size='sm' />}
                              </span>
                            )}
                          </div>
                        </div>
                        {/* post text */}
                        <div className='flex flex-col overflow-hidden  '>
                          {isOriginalPost && (
                            <span className='text-lg whitespace-pre-wrap word-wrap '>
                              {userHighlightMentions(post.text, post.user.name)}{' '}
                            </span>
                          )}
                          {!isOriginalPost && (
                            <span className='text-lg whitespace-pre-wrap word-wrap '>
                              {userHighlightMentions(
                                post.repost.originalText,
                                post.user.name
                              )}
                            </span>
                          )}

                          {isOriginalPost && post.imgs.length > 0 && (
                            <div
                              className={
                                post.imgs.length === 1
                                  ? 'w-full rounded-xl'
                                  : post.imgs.length === 2
                                  ? 'grid grid-cols-2 rounded-2xl max-h-128 h-96 overflow-hidden'
                                  : post.imgs.length === 3
                                  ? 'grid grid-cols-4 rounded-2xl max-h-128 w-full h-96 overflow-hidden'
                                  : post.imgs.length === 4
                                  ? 'grid grid-cols-4  rounded-2xl max-h-128 h-96 w-full overflow-hidden'
                                  : 'grid grid-cols-4 rounded-2xl max-h-128 h-96 w-full overflow-hidden'
                              }>
                              {post.imgs.map((img, index) => (
                                <>
                                  <img
                                    key={index}
                                    src={img}
                                    className={
                                      post.imgs.length === 1
                                        ? 'object-cover rounded-lg border-gray-700 max-h-128'
                                        : post.imgs.length === 2
                                        ? 'h-full object-cover border-gray-700 w-full'
                                        : post.imgs.length === 3 && index === 0
                                        ? 'col-span-2 row-span-2 object-cover border-gray-700 h-full w-full'
                                        : post.imgs.length === 3
                                        ? 'col-span-2 row-span-1 object-cover border-gray-700 h-full w-full'
                                        : post.imgs.length === 4
                                        ? 'col-span-2 row-span-2 object-cover border-gray-700 h-full w-full'
                                        : 'object-cover rounded-lg border-gray-700 w-full'
                                    }
                                    alt={`Post image ${index + 1}`}
                                    onClick={() =>
                                      document
                                        .getElementById(`my_modal_${index}`)
                                        .showModal()
                                    }
                                  />

                                  <dialog
                                    id={`my_modal_${index}`}
                                    className=' modal  '>
                                    <div className=' modal-box bg-slate-300 '>
                                      <form method='dialog'>
                                        <button className='btn btn-xs btn-circle btn-ghost absolute right-2 top-2 '>
                                          ✕
                                        </button>
                                      </form>
                                      <img
                                        src={img}
                                        className='h-full w-full object-fill   rounded-lg  border-gray-700 mt-2 '
                                        alt=''
                                      />
                                    </div>
                                  </dialog>
                                </>
                              ))}
                            </div>
                          )}
                          {!isOriginalPost && post.repost.originalImgs && (
                            <img
                              src={post.repost.originalImg}
                              className='h-full  object-cover  rounded-lg border border-gray-700 mt-2'
                              alt=''
                              style={{ maxWidth: '100%' }}
                            />
                          )}

                          {isOriginalPost &&
                            post.repost.originalImgs.length > 0 && (
                              <div
                                className={
                                  post.repost.originalImgs.length === 1
                                    ? 'w-full rounded-xl'
                                    : post.repost.originalImgs.length === 2
                                    ? 'grid grid-cols-2 rounded-2xl max-h-128 h-96 overflow-hidden'
                                    : post.repost.originalImgs.length === 3
                                    ? 'grid grid-cols-4 rounded-2xl max-h-128 w-full h-96 overflow-hidden'
                                    : post.repost.originalImgs.length === 4
                                    ? 'grid grid-cols-4  rounded-2xl max-h-128 h-96 w-full overflow-hidden'
                                    : 'grid grid-cols-4 rounded-2xl max-h-128 h-96 w-full overflow-hidden'
                                }>
                                {post.repost.originalImgs.map((img, index) => (
                                  <>
                                    <img
                                      key={index}
                                      src={img}
                                      className={
                                        post.imgs.length === 1
                                          ? 'object-cover rounded-lg border-gray-700 max-h-128'
                                          : post.imgs.length === 2
                                          ? 'h-full object-cover border-gray-700 w-full'
                                          : post.imgs.length === 3 &&
                                            index === 0
                                          ? 'col-span-2 row-span-2 object-cover border-gray-700 h-full w-full'
                                          : post.imgs.length === 3
                                          ? 'col-span-2 row-span-1 object-cover border-gray-700 h-full w-full'
                                          : post.imgs.length === 4
                                          ? 'col-span-2 row-span-2 object-cover border-gray-700 h-full w-full'
                                          : 'object-cover rounded-lg border-gray-700 w-full'
                                      }
                                      alt={`Post image ${index + 1}`}
                                      onClick={() =>
                                        document
                                          .getElementById(`my_modal_${index}`)
                                          .showModal()
                                      }
                                    />

                                    <dialog
                                      id={`my_modal_${index}`}
                                      className=' modal  '>
                                      <div className=' modal-box bg-slate-300 '>
                                        <form method='dialog'>
                                          <button className='btn btn-xs btn-circle btn-ghost absolute right-2 top-2 '>
                                            ✕
                                          </button>
                                        </form>
                                        <img
                                          src={img}
                                          className='h-full w-full object-fill   rounded-lg  border-gray-700 mt-2 '
                                          alt=''
                                        />
                                      </div>
                                    </dialog>
                                  </>
                                ))}
                              </div>
                            )}
                        </div>
                        {/* post functions */}

                        <PostFunctions
                          post={post}
                          comments={comments}
                          isRepostedByAuthUser={isRepostedByAuthUser}
                          isOriginalPost={isOriginalPost}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/*  */}

          <div className='px-4'>
            {/* Comment section */}
            {isPostCommentLoading ? (
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

        <CreateCommentForm
          comment={postComment}
          CommentUsername={CommentUsername}
          authUser={authUser}
          type={'replyToComment'}
          commentId={commentId}
        />

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
                className=' border-b  border-gray-200 dark:border-gray-700 hover:bg-slate-200 dark:hover:bg-inherit'>
                <RenderSubComments postComment={reply} pageType={'comment'} />
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default CommentPage;
