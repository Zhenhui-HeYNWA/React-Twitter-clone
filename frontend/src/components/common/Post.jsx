import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';

import { FaRegHeart, FaTrash, FaRegBookmark, FaBookmark } from 'react-icons/fa';

import { BiRepost, BiComment } from 'react-icons/bi';

import LoadingSpinner from './LoadingSpinner';
import { formatPostDate } from '../../utils/date';

const Post = ({ post, posts }) => {
  const [comment, setComment] = useState('');
  const queryClient = useQueryClient();
  const [isRepostedByAuthUser, setIsRepostedByAuthUser] = useState(false);
  const { data: authUser } = useQuery({ queryKey: ['authUser'] });

  const isOriginalPost = post.repost?.originalPost == null;

  useEffect(() => {
    if (authUser) {
      // 查找源帖子 ID（如果是转发的帖子）
      const originalPostId = post.repost?.originalPost || post._id;

      // 检查当前用户是否在转发列表中
      const isReposted = authUser.repostedPosts.includes(originalPostId);
      setIsRepostedByAuthUser(isReposted);
    } else {
      setIsRepostedByAuthUser(false); // 如果没有 authUser, 默认设置为 false
    }
  }, [authUser, post, posts]);

  const isLiked = post.likes.includes(authUser._id);

  const isAuthUserRepost = post.user._id === authUser._id;
  const isMarked = post.bookmarks.includes(authUser._id);
  const isMyPost = authUser._id === post.user._id;

  const formattedDate = formatPostDate(post.createdAt);

  const { mutate: deletePost, isPending: isDeleting } = useMutation({
    mutationFn: async () => {
      try {
        const res = await fetch(`/api/posts/${post._id}`, {
          method: 'DELETE',
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Something went wrong');
        return data;
      } catch (error) {
        throw new Error(error);
      }
    },

    onSuccess: () => {
      toast.success('Post deleted successfully');
      //TODO: Invalidate the query to refetch the data
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  const { mutate: likePost, isPending: isLiking } = useMutation({
    mutationFn: async () => {
      try {
        const res = await fetch(`/api/posts/like/${post._id}`, {
          method: 'POST',
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Something went wrong');
        return data;
      } catch (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: (updatedLikes) => {
      queryClient.setQueryData(['posts'], (oldData) => {
        return oldData.map((p) => {
          if (p._id === post._id) {
            return { ...p, likes: updatedLikes };
          }
          return p;
        });
      });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const { mutate: commentPost, isPending: isCommenting } = useMutation({
    mutationFn: async ({ postId, text }) => {
      try {
        const res = await fetch(`/api/posts/comment/${postId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Something went wrong');
        return { comments: data, postId };
      } catch (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: ({ comments, postId }) => {
      toast.success('Comment posted successfully');
      setComment('');

      // 更新缓存中的评论数据，包括完整的用户信息
      queryClient.setQueryData(['posts'], (oldData) => {
        return oldData.map((p) => {
          if (p._id === postId) {
            return { ...p, comments };
          }
          return p;
        });
      });

      // 关闭评论模态框
      const modal = document.getElementById('comments_modal' + post._id);
      if (modal) {
        modal.close();
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const { mutate: bookmarkPost, isPending: isBookmarking } = useMutation({
    mutationFn: async () => {
      try {
        const res = await fetch(`/api/posts/bookmark/${post._id}`, {
          method: 'POST',
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Something went wrong');
        return data;
      } catch (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: (updatedBookmarks) => {
      // queryClient.invalidateQueries({ queryKey: ['posts'] });
      //Instead, update the cache directly for that post
      queryClient.setQueryData(['posts'], (oldData) => {
        return oldData.map((p) => {
          if (p._id === post._id) {
            return { ...p, bookmarks: updatedBookmarks };
          }
          return p;
        });
      });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const { mutate: repostPost, isPending: isReposting } = useMutation({
    mutationFn: async ({ actionType }) => {
      try {
        const res = await fetch(`/api/posts/repost/${post._id}`, {
          method: 'POST',
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Something went wrong');
        return { data, actionType };
      } catch (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: ({ actionType }) => {
      toast.success(`Post ${actionType} successfully`);
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleDeletePost = () => {
    deletePost();
  };
  const handlePostComment = (e) => {
    e.preventDefault();
    if (isCommenting) return;
    commentPost({ postId: post._id, text: comment });
  };

  const handleBookmarkPost = () => {
    if (isBookmarking) return;
    bookmarkPost();
  };

  const handleLikePost = () => {
    if (isLiking) return;
    likePost();
  };

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
      if (match) {
        return (
          <span key={index}>
            {part}
            <Link to={`/profile/${match.substring(1)}`}>
              <span className='mention-highlight text-sky-500 hover:underline hover:text-sky-700'>
                {match}
              </span>
            </Link>
          </span>
        );
      }
      return part;
    });
  };

  return (
    <>
      <div className='flex flex-col'>
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
          <div className='avatar'>
            {/* Avatar */}
            {isOriginalPost && (
              <Link
                to={`/profile/${post.user.username}`}
                className='w-12 h-12 rounded-full overflow-hidden'>
                <img
                  src={post.user.profileImg || '/avatar-placeholder.png'}
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
          <div className='flex flex-col flex-1'>
            <div className='flex gap-2 items-center '>
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

              <span className='text-gray-700 flex gap-1 text-sm'>
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
                <span>·</span>
                <span>{formattedDate}</span>
              </span>
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
            <div className='flex flex-col gap-3 overflow-hidden'>
              {isOriginalPost && (
                <span className='text-lg'>{highlightMentions(post.text)}</span>
              )}
              {!isOriginalPost && (
                <span className='text-lg'>
                  {highlightMentions(post.repost.originalText)}
                </span>
              )}

              {isOriginalPost && post.img && (
                <Link to={`/${authUser.username}/status/${post._id}`}>
                  <img
                    src={post.img}
                    className='h-80 object-cover rounded-lg border border-gray-700 mt-2'
                    alt=''
                  />
                </Link>
              )}
              {!isOriginalPost && post.repost.originalImg && (
                <Link to={`/${authUser.username}/status/${post._id}`}>
                  <img
                    src={post.repost.originalImg}
                    className='h-80 object-cover rounded-lg border border-gray-700 mt-2'
                    alt=''
                  />
                </Link>
              )}
            </div>
            <div className='flex justify-between mt-3'>
              <div className='flex gap-4 items-center w-2/3 justify-between'>
                <div
                  className='flex gap-1 items-center cursor-pointer group'
                  onClick={() =>
                    document
                      .getElementById('comments_modal' + post._id)
                      .showModal()
                  }>
                  <BiComment className='w-5 h-5  text-slate-500 group-hover:text-sky-400' />
                  <span className='text-sm text-slate-500 group-hover:text-sky-400'>
                    {post.comments.length}
                  </span>
                </div>
                {/* We're using Modal Component from DaisyUI */}
                <dialog
                  id={`comments_modal${post._id}`}
                  className='modal border-none outline-none'>
                  <div className='modal-box rounded border bg-gray-100 dark:bg-secondary  border-gray-600'>
                    <h3 className='font-bold text-lg mb-4'>COMMENTS</h3>
                    <div className='flex flex-col gap-3 max-h-60 overflow-auto'>
                      {post.comments.length === 0 && (
                        <p className='text-sm text-slate-500'>
                          No comments yet 🤔 Be the first one 😉
                        </p>
                      )}
                      {post.comments.map((comment) => (
                        <div
                          key={comment._id}
                          className='flex gap-2 items-start'>
                          <div className='avatar'>
                            <div className='w-8 rounded-full'>
                              <img
                                src={
                                  comment.user.profileImg ||
                                  '/avatar-placeholder.png'
                                }
                              />
                            </div>
                          </div>
                          <div className='flex flex-col'>
                            <div className='flex items-center gap-1'>
                              <span className='font-bold'>
                                {comment.user.fullName}
                              </span>
                              <span className='text-gray-700 text-sm'>
                                @{comment.user.username}
                              </span>
                            </div>
                            <div className='text-sm'>{comment.text}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <form
                      className='flex gap-2 items-center mt-4 border-t border-gray-300  dark:border-gray-800  pt-2'
                      onSubmit={handlePostComment}>
                      <textarea
                        className='textarea w-full p-1 rounded text-md resize-none border focus:outline-none  bg-gray-100 dark:bg-secondary border-gray-100  dark:border-gray-800'
                        placeholder='Add a comment...'
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                      />
                      <button className='btn btn-primary rounded-full btn-sm text-white px-4'>
                        {isCommenting ? <LoadingSpinner size='md' /> : 'Post'}
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
                          {post.repostByNum}
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
                    {post.likes.length}
                  </span>
                </div>
              </div>
              <div
                className='flex w-1/3 justify-end gap-2 group items-center'
                onClick={handleBookmarkPost}>
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
    </>
  );
};
export default Post;
