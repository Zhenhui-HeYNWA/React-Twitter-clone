import { useQuery } from '@tanstack/react-query';
import { BiRepost } from 'react-icons/bi';
import {
  FaArrowLeft,
  FaRegBookmark,
  FaRegComment,
  FaRegHeart,
} from 'react-icons/fa';
import { Link, useParams } from 'react-router-dom';
import LoadingSpinner from './LoadingSpinner';
import { flatMap } from 'lodash';
import { formatDateTime, formatPostDate } from '../../utils/date';

const SinglePost = () => {
  const { username, postId } = useParams();
  console.log(username);
  console.log(postId);
  const isLiked = false;
  const {
    data: post,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['post', postId],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/posts/${username}/status/${postId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Something went wrong');
        console.log(data);
        return data;
      } catch (error) {
        throw new Error(error.message);
      }
    },
  });

  if (isLoading || isRefetching) {
    return <LoadingSpinner />;
  }

  if (!post) {
    return <div>Post not found</div>;
  }

  const user = post.user;
  const formattedDate = formatDateTime(post.createdAt);

  return (
    <>
      <div className='flex-[4_4_0] border-r border-gray-200 dark:border-gray-700 min-h-screen p-2'>
        <div className='flex flex-col'>
          <div className='flex gap-10 px-4 py-2 items-center'>
            <Link to='/'>
              <FaArrowLeft className='w-4 h-4' />
            </Link>
            <div className='flex flex-col'>
              <p className='font-bold text-lg'>Post</p>
            </div>
          </div>
          <div className='flex gap-2 items-start p-4 border-b border-gray-200 dark:border-gray-700'>
            <div className='flex flex-col flex-1 '>
              <div className='flex flex-row gap-3'>
                <div className='avatar'>
                  <Link
                    to={`/profile/${user?.username}`}
                    className='w-10 h-10 rounded-full overflow-hidden'>
                    <img
                      src={user?.profileImg || '/avatar-placeholder.png'}
                      alt='User Avatar'
                    />
                  </Link>
                </div>
                <div className='flex flex-col  '>
                  <Link to={`/profile/${user?.username}`} className='font-bold'>
                    {user?.fullName}
                  </Link>
                  <span className='text-gray-700 flex gap-1 text-sm'>
                    <Link to={`/profile/${user?.username}`}>
                      @{user?.username}
                    </Link>
                  </span>
                </div>
              </div>
              <div className='flex flex-col gap-3 overflow-hidden'>
                <span>{post.text}</span>
                {post.img && (
                  <img
                    src={post.img}
                    className='h-80 object-cover rounded-lg border border-gray-700'
                    alt='Post Image'
                  />
                )}
              </div>
              <div className='text-sm mt-2 text-gray-700 flex gap-1 '>
                {formattedDate}
              </div>
            </div>
          </div>

          <div className='flex justify-between my-1 px-4 border-b border-gray-200 dark:border-gray-700 py-2'>
            <div className='flex gap-4 items-center w-2/3 justify-between'>
              <div
                className='flex gap-1 items-center cursor-pointer group'
                onClick={() =>
                  document
                    .getElementById('comments_modal' + post._id)
                    .showModal()
                }>
                <FaRegComment className='w-4 h-4 text-slate-500 group-hover:text-sky-400' />
                <span className='text-sm text-slate-500 group-hover:text-sky-400'>
                  {post.comments.length}
                </span>
              </div>
              <dialog
                id={`comments_modal${post._id}`}
                className='modal border-none outline-none'>
                <div className='modal-box rounded border bg-gray-100 dark:bg-secondary border-gray-600'>
                  <h3 className='font-bold text-lg mb-4'>COMMENTS</h3>
                  <div className='flex flex-col gap-3 max-h-60 overflow-auto'>
                    {post.comments.length === 0 && (
                      <p className='text-sm text-slate-500'>
                        No comments yet 🤔 Be the first one 😉
                      </p>
                    )}
                    {post.comments.map((comment) => (
                      <div key={comment._id} className='flex gap-2 items-start'>
                        <div className='avatar'>
                          <div className='w-8 rounded-full'>
                            <img
                              src={
                                comment.user.profileImg ||
                                '/avatar-placeholder.png'
                              }
                              alt='Comment User Avatar'
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
                </div>
                <form method='dialog' className='modal-backdrop'>
                  <button className='outline-none'>close</button>
                </form>
              </dialog>
              <div className='flex gap-1 items-center group cursor-pointer'>
                <BiRepost className='w-6 h-6 text-slate-500 group-hover:text-green-500' />
                <span className='text-sm text-slate-500 group-hover:text-green-500'>
                  0
                </span>
              </div>
              <div className='flex gap-1 items-center group cursor-pointer'>
                <FaRegHeart className='w-4 h-4 cursor-pointer text-pink-500' />
                <span
                  className={`text-sm group-hover:text-pink-500 ${
                    isLiked ? 'text-pink-500' : 'text-slate-500'
                  }`}>
                  {post.likes.length}
                </span>
              </div>
            </div>
            <div className='flex w-1/3 justify-end gap-2 group items-center'>
              <FaRegBookmark className='w-4 h-4 text-slate-500 cursor-pointer group-hover:text-sky-400' />
            </div>
          </div>
          <div className=''>
            {post.comments.map((comment) => {
              console.log(comment.createdAt);
              const formattedHours = formatPostDate(comment.createdAt);
              return (
                <div
                  key={comment._id}
                  className=' border-b border-gray-200 dark:border-gray-700'>
                  <div className='flex gap-2  flex-col items-start'>
                    <div className='px-2 py-1 flex gap-2'>
                      <div className='avatar'>
                        <div className='w-8 h-8 rounded-full'>
                          <img
                            src={
                              comment.user.profileImg ||
                              '/avatar-placeholder.png'
                            }
                            alt='Comment User Avatar'
                          />
                        </div>
                      </div>
                      <div className='flex flex-col'>
                        <div className='flex items-center gap-1'>
                          <span className='font-bold text-base'>
                            {comment.user.fullName}
                          </span>
                          <span className='text-gray-700 text-sm'>
                            @{comment.user.username}
                          </span>
                          <span className='text-gray-700 text-sm'>·</span>
                          <span className='text-gray-700 text-sm'>
                            {formattedHours}
                          </span>
                        </div>
                        <div className='text-sm'>{comment.text}</div>
                      </div>
                    </div>
                  </div>
                  {/* comment like section */}
                  <div className='flex   justify-between my-1 px-12'>
                    <div className='flex gap-4 items-center w-2/3 justify-between'>
                      <div
                        className='flex gap-1 items-center cursor-pointer group'
                        // onClick={() =>
                        //   document
                        //     .getElementById('comments_modal' + post._id)
                        //     .showModal()}
                      >
                        <FaRegComment className='w-4 h-4 text-slate-500 group-hover:text-sky-400' />
                        <span className='text-sm text-slate-500 group-hover:text-sky-400'>
                          {/* {post.comments.length} */}
                        </span>
                      </div>
                      {/* <dialog
                        id={`comments_modal${post._id}`}
                        className='modal border-none outline-none'>
                        <div className='modal-box rounded border bg-gray-100 dark:bg-secondary border-gray-600'>
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
                                      alt='Comment User Avatar'
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
                        </div>
                        <form method='dialog' className='modal-backdrop'>
                          <button className='outline-none'>close</button>
                        </form>
                      </dialog> */}
                      <div className='flex gap-1 items-center group cursor-pointer'>
                        <BiRepost className='w-6 h-6 text-slate-500 group-hover:text-green-500' />
                        <span className='text-sm text-slate-500 group-hover:text-green-500'>
                          0
                        </span>
                      </div>
                      <div className='flex gap-1 items-center group cursor-pointer'>
                        <FaRegHeart className='w-4 h-4 cursor-pointer text-pink-500' />
                        {/* <span
                          className={`text-sm group-hover:text-pink-500 ${
                            isLiked ? 'text-pink-500' : 'text-slate-500'
                          }`}>
                          {post.likes.length}
                        </span> */}
                      </div>
                    </div>
                    <div className='flex w-1/3 justify-end gap-2 group items-center'>
                      <FaRegBookmark className='w-4 h-4 text-slate-500 cursor-pointer  group-hover:text-sky-400' />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

export default SinglePost;
