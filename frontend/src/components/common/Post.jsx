import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { FaRegHeart, FaTrash, FaRegBookmark, FaBookmark } from 'react-icons/fa';
import { BiRepost, BiComment } from 'react-icons/bi';

import LoadingSpinner from './LoadingSpinner';
import { formatPostDate } from '../../utils/date';
import usePostMutations from '../../hooks/usePostMutations';

// Function to check the existence of mentioned users
const fetchMentionedUsersExistence = async (usernames) => {
  const res = await fetch('/api/users/check-user', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ usernames }),
  });
  const data = await res.json();
  return data; // This should return an object like { username1: true, username2: false }
};

// Post component
const Post = ({ post, posts }) => {
  const [comment, setComment] = useState(''); // State to store comment input
  const [isRepostedByAuthUser, setIsRepostedByAuthUser] = useState(false); // State to track if the post is reposted by the authenticated user
  const [mentionedUsersExistence, setMentionedUsersExistence] = useState({}); // State to store the existence of mentioned users
  const { data: authUser } = useQuery({ queryKey: ['authUser'] }); // Fetch the current authenticated user's data

  const postId = post?._id; // Get the current post ID
  const isOriginalPost = post.repost?.originalPost == null; // Check if the post is an original post

  // Check if the authenticated user has reposted this post
  useEffect(() => {
    if (authUser) {
      const originalPostId = post.repost?.originalPost || post._id;
      const isReposted = authUser.repostedPosts.includes(originalPostId);
      setIsRepostedByAuthUser(isReposted);
    } else {
      setIsRepostedByAuthUser(false);
    }
  }, [authUser, post, posts]);

  // Fetch comments for the specific post
  const fetchComments = async (postId) => {
    const res = await fetch(
      `/api/comments/${post.user.username}/status/${postId}/comments`
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Something went wrong');
    return data;
  };

  // Inside your Post component:
  const { data: comments } = useQuery({
    queryKey: ['comments', postId],
    queryFn: () => fetchComments(postId),
  });

  // Check if mentioned users exist
  useEffect(() => {
    const mentionedUsernames = (
      post?.text?.match(/@\w+/g) ||
      post?.repost?.originalText?.match(/@\w+/g) ||
      []
    ).map((m) => m.substring(1));

    if (mentionedUsernames.length > 0) {
      fetchMentionedUsersExistence(mentionedUsernames).then(
        setMentionedUsersExistence
      );
    }
  }, [post.text, post.repost.originalText]);

  const isLiked = post.likes.includes(authUser._id); // Check if the post is liked by the authenticated user
  const isAuthUserRepost = post.user._id === authUser._id; // Check if the repost was made by the authenticated user
  const isMarked = post.bookmarks.includes(authUser._id); // Check if the post is bookmarked by the authenticated user
  const isMyPost = authUser._id === post.user._id; // Check if the post belongs to the authenticated user
  const formattedDate = formatPostDate(post.createdAt); // Format the post creation date

  // Hook to handle post mutations like delete, like, bookmark, and repost
  const {
    commentPostAdvanced,
    isPostCommenting,
    likePost,
    isLiking,
    deletePost,
    isDeleting,
    bookmarkPost,
    isBookmarking,
    repostPost,
    isReposting,
  } = usePostMutations(postId);

  // Handle post deletion
  const handleDeletePost = () => {
    if (isDeleting) return;
    deletePost({
      onSuccess: () => {
        setIsRepostedByAuthUser(false); // Reset the repost state after deletion
      },
    });
  };

  // Handle comment submission
  const handlePostComment = (e) => {
    e.preventDefault();
    if (isPostCommenting) return;
    commentPostAdvanced(
      { postId: postId, text: comment },
      {
        onSuccess: () => {
          setComment(''); // Clear the comment input after successful submission

          const modal = document.getElementById('comments_modal' + post._id);
          if (modal) {
            modal.close();
          }
        },
      }
    );
  };

  // Handle bookmarking the post
  const handleBookmarkPost = () => {
    if (isBookmarking) return;
    bookmarkPost();
  };

  // Handle liking the post
  const handleLikePost = () => {
    if (isLiking) return;
    likePost();
  };

  // Handle reposting the post
  const handleRepost = () => {
    if (isReposting) return;

    if (isRepostedByAuthUser) {
      repostPost({ actionType: 'remove' });
      return;
    }
    repostPost({ actionType: 'repost' });
    return;
  };

  // Highlight mentions in the post text
  const highlightMentions = (text) => {
    const regex = /@\w+/g;
    const handleClick = (e, path) => {
      e.stopPropagation();
      window.location.href = path;
    };

    return text.split(regex).reduce((acc, part, index) => {
      if (index === 0) {
        return [part];
      }

      const match = text.match(regex)[index - 1];
      const username = match.substring(1);

      acc.push(
        <span
          key={post._id + index}
          className='mention-highlight text-sky-500 hover:underline hover:text-sky-700'
          onClick={(e) => handleClick(e, `/profile/${username}`)}
          style={{ cursor: 'pointer' }}>
          {match}
        </span>,
        part
      );

      return acc;
    }, []);
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
                <Link
                  className='nav-link'
                  to={`/${authUser.username}/status/${post._id}`}>
                  <span className='text-lg'>
                    {highlightMentions(post.text)}
                  </span>
                </Link>
              )}
              {!isOriginalPost && (
                <Link
                  className='nav-link'
                  to={`/${authUser.username}/status/${post._id}`}>
                  <span className='text-lg'>
                    {highlightMentions(post.repost.originalText)}
                  </span>
                </Link>
              )}

              {isOriginalPost && post.img && (
                <Link
                  className='nav-link'
                  to={`/${authUser.username}/status/${post._id}`}>
                  <img
                    src={post.img}
                    className='h-80 object-cover rounded-lg border border-gray-700 mt-2'
                    alt=''
                  />
                </Link>
              )}
              {!isOriginalPost && post.repost.originalImg && (
                <Link
                  className='nav-link'
                  to={`/${authUser.username}/status/${post._id}`}>
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
                  <div className='modal-box rounded-xl border bg-gray-100 dark:bg-[#15202B]  border-gray-400'>
                    <h3 className='font-bold text-lg mb-4'>COMMENTS</h3>
                    <div className='flex flex-col gap-3 max-h-60 overflow-auto'>
                      {post?.comments?.length === 0 && (
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
                                  comment.user.profileImg ||
                                  '/avatar-placeholder.png'
                                }
                              />
                            </div>
                          </div>
                          <div className='flex flex-col'>
                            <div className='flex items-center gap-1'>
                              <span className='font-bold'>
                                {comment?.user?.fullName}
                              </span>
                              <span className='text-gray-700 text-sm'>
                                @{comment?.user?.username}
                              </span>
                            </div>
                            <div className='text-sm'>{comment?.text}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <form
                      className='flex gap-2 items-center mt-4 border-t border-gray-300  dark:border-gray-800  pt-2'
                      onSubmit={handlePostComment}>
                      <textarea
                        className='textarea w-full p-1 rounded text-md resize-none border focus:outline-none  bg-gray-100 dark:bg-[#15202B]  border-gray-100  dark:border-gray-800'
                        placeholder='Add a comment...'
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                      />
                      <button className='btn btn-primary rounded-full btn-sm text-white px-4'>
                        {isPostCommenting ? (
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
