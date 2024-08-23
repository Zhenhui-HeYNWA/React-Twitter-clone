import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { FaTrash } from 'react-icons/fa';
import { BiRepost } from 'react-icons/bi';

import LoadingSpinner from './LoadingSpinner';
import { formatPostDate } from '../../utils/date';
import usePostMutations from '../../hooks/usePostMutations';
import PostFunctions from './PostFunctions';

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
  const navigate = useNavigate();

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

  const isAuthUserRepost = post.user._id === authUser._id; // Check if the repost was made by the authenticated user

  const isMyPost = authUser._id === post.user._id; // Check if the post belongs to the authenticated user
  const formattedDate = formatPostDate(post.createdAt); // Format the post creation date

  // Hook to handle post mutations like delete, like, bookmark, and repost
  const { deletePost, isDeleting } = usePostMutations(postId);

  // Handle post deletion
  const handleDeletePost = () => {
    if (isDeleting) return;
    deletePost({
      onSuccess: () => {
        setIsRepostedByAuthUser(false); // Reset the repost state after deletion
      },
    });
  };

  // Highlight mentions in the post text
  const highlightMentions = (text) => {
    const regex = /@\w+/g;
    const handleClick = (e, path) => {
      e.stopPropagation();
      console.log(e);
      console.log(path);
      navigate(path);
    };

    return text.split(regex).reduce((acc, part, index) => {
      if (index === 0) {
        return [part];
      }

      const match = text.match(regex)[index - 1];
      const mentionedUsername = match.substring(1);

      acc.push(
        <span
          key={post._id + index}
          className='mention-highlight text-sky-500 hover:underline hover:text-sky-700'
          onClick={(e) => handleClick(e, `/profile/${mentionedUsername}`)}
          style={{ cursor: 'pointer' }}>
          {match}
        </span>,
        part
      );

      return acc;
    }, []);
  };

  console.log(post.imgs);
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
        <div className='flex gap-4 items-start py-2 border-b border-gray-200 dark:border-gray-700 justify-center px-4 '>
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
          <div className='flex flex-col flex-1  '>
            <div className='flex   justify-between items-center w-full  '>
              <div className='flex flex-row gap-1 items-center max-w-sm '>
                {/* fullName */}
                {isOriginalPost && (
                  <Link to={`/profile/${post.user.username}`}>
                    <span className=' font-bold text-nowrap '>
                      {post.user.fullName}
                    </span>
                  </Link>
                )}
                {!isOriginalPost && (
                  <Link to={`/profile/${post.repost.postOwner.username}`}>
                    <span className=' font-bold text-nowrap'>
                      {post.repost.postOwner.fullName}
                    </span>
                  </Link>
                )}

                <span className='text-gray-700 flex gap-1 text-basic '>
                  <span className='text-gray-500 truncate max-w-20 md:max-w-52 text-basic'>
                    <Link
                      to={`/profile/${
                        isOriginalPost
                          ? post.user.username
                          : post.repost.postOwner.username
                      }`}>
                      {isOriginalPost ? (
                        <span>@{post.user.username}</span>
                      ) : (
                        <span>@{post.repost.postOwner.username}</span>
                      )}
                    </Link>
                  </span>
                  <span className='text-gray-500 text-nowrap'>·</span>
                  <span className='text-gray-500 text-nowrap'>
                    {formattedDate}
                  </span>
                </span>
              </div>
              <div>
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
            <div className='flex flex-col gap-3 overflow-hidden  '>
              {isOriginalPost && (
                <span
                  className='nav-link'
                  onClick={() =>
                    navigate(`/${authUser.username}/status/${post._id}`)
                  }>
                  <span className=' text-lg whitespace-pre-wrap word-wrap '>
                    {highlightMentions(post.text)}
                  </span>
                </span>
              )}
              {!isOriginalPost && (
                <span
                  className='nav-link'
                  onClick={() =>
                    navigate(`/${authUser.username}/status/${post._id}`)
                  }>
                  <span className='text-lg whitespace-pre-wrap word-wrap '>
                    {highlightMentions(post.repost.originalText)}
                  </span>
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
                        navigate(`/${authUser.username}/status/${post._id}`)
                      }
                    />
                  ))}
                </div>
              )}
              {!isOriginalPost && post.repost.originalImgs?.length > 0 && (
                <div
                  className={
                    post.repost.originalImgs === 1
                      ? 'w-full rounded-xl'
                      : post.repost.originalImgs === 2
                      ? 'grid grid-cols-2 rounded-2xl max-h-128 h-96 overflow-hidden'
                      : post.repost.originalImgs === 3
                      ? 'grid grid-cols-4 rounded-2xl max-h-128 w-full h-96 overflow-hidden'
                      : post.repost.originalImgs === 4
                      ? 'grid grid-cols-4  rounded-2xl max-h-128 h-96 w-full overflow-hidden'
                      : 'grid grid-cols-4 rounded-2xl max-h-128 h-96 w-full overflow-hidden'
                  }>
                  {post.repost.originalImgs.map((img, index) => (
                    <img
                      key={index}
                      src={img}
                      className={
                        post.repost.originalImgs.length === 1
                          ? 'object-cover rounded-lg border-gray-700 max-h-128'
                          : post.repost.originalImgs.length === 2
                          ? 'h-full object-cover border-gray-700 w-full'
                          : post.repost.originalImgs.length === 3 && index === 0
                          ? 'col-span-2 row-span-2 object-cover border-gray-700 h-full w-full'
                          : post.repost.originalImgs.length === 3
                          ? 'col-span-2 row-span-1 object-cover border-gray-700 h-full w-full'
                          : post.repost.originalImgs.length === 4
                          ? 'col-span-2 row-span-2 object-cover border-gray-700 h-full w-full'
                          : 'object-cover rounded-lg border-gray-700 w-full'
                      }
                      alt={`Post image ${index + 1}`}
                      onClick={() =>
                        navigate(`/${authUser.username}/status/${post._id}`)
                      }
                    />
                  ))}
                </div>
              )}
            </div>

            <PostFunctions
              post={post}
              comments={comments}
              isRepostedByAuthUser={isRepostedByAuthUser}
              isOriginalPost={isOriginalPost}
            />
          </div>
        </div>
      </div>
    </>
  );
};
export default Post;
