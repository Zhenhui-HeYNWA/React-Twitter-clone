import usePostMutations from '../../hooks/usePostMutations';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RiShare2Line } from 'react-icons/ri';
import { BiComment, BiRepost } from 'react-icons/bi';
import LoadingSpinner from './LoadingSpinner';
import { AiOutlineLink } from 'react-icons/ai';
import { FaBookmark, FaRegBookmark, FaRegHeart } from 'react-icons/fa';
import toast from 'react-hot-toast';

const PostFunctions = ({ post, comments, isRepostedByAuthUser, size }) => {
  const { data: authUser } = useQuery({ queryKey: ['authUser'] });
  const [comment, setComment] = useState('');

  const postId = post?._id;
  const isOriginalPost = post?.repost?.originalPost == null;
  const isLiked = post?.likes.includes(authUser._id);

  // Check if the post is liked by the authenticated user
  const isMarked = post?.bookmarks.includes(authUser._id);

  // Check if the post is bookmarked by the authenticated user
  // Fetch the current authenticated user's data
  // Hook to handle post mutations like delete, like, bookmark, and repost
  const {
    commentPostAdvanced,
    isPostCommenting,
    likePost,
    isLiking,
    bookmarkPost,
    isBookmarking,
    repostPost,
    isReposting,
  } = usePostMutations(postId);

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

  // Handle liking the post
  const handleLikePost = () => {
    if (isLiking) return;
    likePost();
  };

  // Handle bookmarking the post
  const handleBookmarkPost = () => {
    if (isBookmarking) return;
    bookmarkPost();
  };

  //Handle ShareLink
  const handleShareLink = async (url) => {
    const content = window.location.origin + url;
    try {
      await navigator.clipboard.writeText(content);
      toast.success('Post link Copied');
      console.log('content', content);
    } catch (error) {
      toast.error('Failed to Copy');
      console.log(error);
    }
  };
  return (
    <div
      className={`flex justify-between  w-full ${
        size === 'lg' ? '' : 'mt-3'
      } `}>
      <div className='flex gap-4 items-center w-full justify-between '>
        <div
          className='flex gap-1 items-center cursor-pointer group w-12 '
          onClick={() =>
            document.getElementById('comments_modal' + post._id).showModal()
          }>
          <BiComment
            className={`${
              size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'
            }  text-slate-500 group-hover:text-sky-400`}
          />
          <span
            className={`${
              size === 'lg' ? 'text-base' : 'text-sm'
            } text-slate-500 group-hover:text-sky-400`}>
            {post?.comments?.length}
          </span>
        </div>
        {/* We're using Modal Component from DaisyUI */}
        <dialog
          id={`comments_modal${post?._id}`}
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
                <div key={comment?._id} className='flex gap-2 items-start'>
                  <div className='avatar'>
                    <div className='w-8 rounded-full'>
                      <img
                        src={
                          comment.user.profileImg || '/avatar-placeholder.png'
                        }
                      />
                    </div>
                  </div>
                  <div className='flex flex-col'>
                    <div className='flex items-center gap-1'>
                      <span className='font-bold'>
                        {comment?.user?.fullName}
                      </span>
                      <span className='text-gray-700 text-sm '>
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
                {isPostCommenting ? <LoadingSpinner size='md' /> : 'Post'}
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
                className='dropdown-content menu bg-gray-100 dark:bg-[#1E2732]  border-gray-200 border rounded-box z-[1] w-52 p-2 shadow  '>
                <li onClick={handleRepost}>
                  <button className='text-red-500'>Undo repost</button>
                </li>
              </ul>
            ) : (
              ''
            )}

            {isReposting && <LoadingSpinner size='sm' />}

            {isOriginalPost && (
              <div className='flex flex-row items-center gap-1 w-12 '>
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
                  className={`${
                    size === 'lg' ? 'text-base' : 'text-sm'
                  } font-normal ${
                    isRepostedByAuthUser
                      ? ' text-green-500 group-hover:text-red-600'
                      : ' text-slate-500 group-hover:text-green-500'
                  }`}>
                  {post?.repostByNum}
                </span>
              </div>
            )}
            {!isOriginalPost && (
              <div className='flex  items-center  w-12 '>
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
                  className={`${
                    size === 'lg' ? 'text-base' : 'text-sm'
                  } font-normal ${
                    isRepostedByAuthUser
                      ? ' text-green-500 group-hover:text-red-600'
                      : ' text-slate-500 group-hover:text-green-500'
                  }`}>
                  {post.repost.repostNum}
                </span>
              </div>
            )}
          </div>
        </div>
        <div
          className='flex gap-1 items-center group cursor-pointer w-12'
          onClick={handleLikePost}>
          {isLiking && <LoadingSpinner size='sm' />}
          {!isLiked && !isLiking && (
            <FaRegHeart
              size={`${size === 'lg' ? 18 : 15}`}
              className={` cursor-pointer text-slate-500 group-hover:text-pink-500`}
            />
          )}
          {isLiked && !isLiking && (
            <FaRegHeart className='w-4 h-4 cursor-pointer text-pink-500 ' />
          )}

          <span
            className={`${
              size === 'lg' ? 'text-base' : 'text-sm'
            }  group-hover:text-pink-500 ${
              isLiked ? 'text-pink-500' : 'text-slate-500'
            }`}>
            {post?.likes.length}
          </span>
        </div>

        <div className='flex gap-2 '>
          <div
            className='flex gap-2 group items-center'
            onClick={handleBookmarkPost}>
            {isBookmarking && <LoadingSpinner size='sm' />}
            {!isMarked && !isBookmarking && (
              <FaRegBookmark
                size={`${size === 'lg' ? 18 : 15}`}
                className=' text-slate-500 cursor-pointer group-hover:fill-black'
              />
            )}
            {isMarked && !isBookmarking && (
              <FaBookmark
                size={`${size === 'lg' ? 18 : 15}`}
                className=' cursor-pointer  '
              />
            )}
          </div>

          <div className=' dropdown dropdown-top  dropdown-end '>
            <RiShare2Line
              size={`${size === 'lg' ? 20 : 18}`}
              className=' text-slate-500 '
              tabIndex={0}
              role='button'
            />

            <ul
              tabIndex={0}
              className='dropdown-content menu bg-slate-100 dark:bg-[#1E2732]  border-gray-200 border  rounded-box z-[1] w-52 p-2 shadow'>
              <li
                className='flex'
                onClick={() =>
                  handleShareLink(`/${authUser.username}/status/${post._id}`)
                }>
                <>
                  <span className=' text-slate-700  dark:text-slate-200'>
                    {' '}
                    <AiOutlineLink className='w-5 h-5 text-slate-700  dark:text-slate-200' />
                    Copy link
                  </span>
                </>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostFunctions;
