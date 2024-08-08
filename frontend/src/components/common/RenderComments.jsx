import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import LoadingSpinner from './LoadingSpinner';
import { FaRegBookmark, FaRegHeart, FaTrash } from 'react-icons/fa';
import { BiBookmark, BiComment, BiLike, BiRepost } from 'react-icons/bi';
import CommentSkeleton from '../skeletons/CommentSkeleton';
import { formatDateTime, formatPostDate } from '../../utils/date';
import { useEffect, useState } from 'react';

const RenderComments = ({ comment }) => {
  const { data: authUser } = useQuery({
    queryKey: ['authUser'],
  });

  const [isLoading, setIsLoading] = useState(true);
  const [structuredComments, setStructuredComments] = useState([]);
  const isMyComment = authUser._id === comment?.user._id;
  const isCommentDeleting = false;

  console.log('This is comment', comment);
  const isSubComment = comment?.parentId !== null;
  console.log(isSubComment);
  const parentComment = comment?.parentId;
  console.log('parentComment', parentComment);

  function getParentCommentsIterative(comment) {
    const result = [];

    let currentComment = comment;
    while (currentComment?.parentId) {
      result.push({
        _id: currentComment.parentId._id,
        text: currentComment.parentId.text,
        user: currentComment.parentId.user,
        replies: currentComment.parentId.replies,
        createdAt: formatPostDate(currentComment.parentId.createdAt),
      });
      currentComment = currentComment.parentId;
    }

    return result.reverse();
  }

  useEffect(() => {
    if (isSubComment) {
      const structured = getParentCommentsIterative(comment);
      setStructuredComments(structured);
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, [comment, isSubComment]);

  console.log('structuredComments', structuredComments);
  return (
    <>
      <div className='w-full md:px-2.5'>
        {isSubComment && isLoading && <CommentSkeleton />}
        {isSubComment &&
          !isLoading &&
          structuredComments?.map((structuredComment) => {
            return (
              <div key={structuredComment._id}>
                {' '}
                <div className='flex gap-2 items-start py-1 px-4  relative'>
                  {/* 线条 */}

                  <div className='relative flex flex-col flex-1'>
                    <div className='flex flex-col gap-2 justify-between'>
                      <div className='flex gap-4 '>
                        <div className='flex flex-col  items-center'>
                          <div className=' avatar '>
                            {/* Avatar */}
                            <Link
                              to={`/profile/${structuredComment?.user.profileImg}`}
                              className='w-12 h-12 rounded-full overflow-hidden block'>
                              <img
                                src={
                                  structuredComment?.user.profileImg ||
                                  '/avatar-placeholder.png'
                                }
                                alt=''
                              />
                            </Link>
                            {/* <div className='absolute left-[calc(50%)] top-[3rem] w-0.5 bg-gray-300 h-[calc(100%+2rem)]'></div> */}
                          </div>
                          <div
                            className='  w-0.5 h-full mt-1
                     bg-slate-300  '></div>
                        </div>

                        <div className='flex flex-col w-full gap-1'>
                          <div className='flex items-center justify-between '>
                            <div className='flex flex-row items-center justify-start gap-2'>
                              <Link
                                to={`/profile/${structuredComment?.user.username}`}
                                className='font-bold'>
                                {structuredComment?.user.fullName}
                              </Link>

                              {/* username */}
                              <span className='text-gray-500 flex gap-1 text-base'>
                                <Link
                                  to={`/profile/${structuredComment?.user.username}`}>
                                  @{structuredComment?.user.username}
                                </Link>
                              </span>
                              <span className='text-base text-gray-500'>·</span>
                              <span className='text-base text-gray-500 flex gap-1'>
                                {structuredComment?.createdAt}
                              </span>
                            </div>
                            {isMyComment && (
                              <div className='flex justify-end items-center'>
                                <span className='flex justify-end flex-1'>
                                  {!isCommentDeleting && (
                                    <FaTrash
                                      className='cursor-pointer hover:text-red-500'
                                      // onClick={handleDeletePost}
                                    />
                                  )}
                                  {isCommentDeleting && (
                                    <LoadingSpinner size='sm' />
                                  )}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* comment text section */}
                          <div className='flex flex-col overflow-hidden '>
                            <span className='text-lg'>
                              {structuredComment?.text}
                            </span>
                          </div>

                          {/* comment functions section*/}
                          <div className='flex flex-row items-center justify-between '>
                            <div className='flex gap-1 items-center cursor-pointer group'>
                              <BiComment className='w-4 h-4 text-slate-500 group-hover:text-sky-400' />
                              <span className='text-sm text-slate-500 group-hover:text-sky-400'>
                                {structuredComment?.replies.length}
                              </span>{' '}
                            </div>

                            <div className='flex items-center group cursor-pointer gap-1'>
                              <BiRepost
                                className={`w-6 h-6 text-slate-500 group-hover:text-green-500`}
                              />
                              <span
                                className='text-sm group-hover:text-green-500 
                        text-slate-500'>
                                0
                              </span>
                            </div>
                            {/* like post  */}
                            <div className='flex gap-1 items-center group cursor-pointer'>
                              <FaRegHeart className='w-4 h-4 cursor-pointer text-slate-500 group-hover:text-pink-500' />
                              <span
                                className={`text-sm group-hover:text-pink-500 
                        text-slate-500`}>
                                0
                              </span>
                            </div>
                            {/* bookmark */}
                            <div className='flex gap-2 group items-center'>
                              <FaRegBookmark className='w-4 h-4 text-slate-500 cursor-pointer group-hover:fill-black' />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

        {/* 下方评论内容 */}
        {comment && (
          <div className='flex flex-col gap-2 items-start  px-4  relative'>
            <div className=' flex flex-row justify-between w-full'>
              <div className=' flex flex-row gap-3  items-center'>
                {/* Avatar */}
                <div className='flex flex-col  items-center'>
                  <div className=' avatar'>
                    <Link className='w-12 h-12 rounded-full overflow-hidden block'>
                      <img src={comment?.user.profileImg} alt='' />
                    </Link>
                  </div>
                </div>

                <div className='flex flex-col   '>
                  <Link to={`/profile/${comment?.user.username}`}>
                    <div className=' font-bold '>{comment?.user.username}</div>
                    <div className='text-gray-500 flex text-base'>
                      @{comment?.user.fullName}
                    </div>
                  </Link>
                </div>
              </div>
              {isMyComment && (
                <div className='flex'>
                  <span className='flex flex-1'>
                    {!isCommentDeleting && (
                      <FaTrash
                        className='cursor-pointer hover:text-red-500'
                        // onClick={handleDeletePost}
                      />
                    )}
                    {isCommentDeleting && <LoadingSpinner size='sm' />}
                  </span>
                </div>
              )}
            </div>

            {/* Comment text section */}
            <div className='flex flex-col gap-y-2 w-full'>
              <div className='my-1 text-lg'>{comment?.text}</div>
              <div className='text-gray-500'>
                {formatDateTime(comment?.createdAt)}
              </div>
              <div className='flex flex-row gap-5 items-center justify-between border-y-2  border-gray-700 py-4'>
                <div className='flex flex-row gap-2 items-center text-slate-500 hover:text-sky-400 cursor-pointer'>
                  <BiComment size={20} />
                  <span>{comment?.replies?.length}</span>
                </div>

                <div className='flex flex-row gap-2 items-center text-slate-500 hover:text-green-500 cursor-pointer'>
                  <BiRepost size={26} />
                  <span>0</span>
                </div>

                <div className='flex flex-row gap-2 items-center text-slate-500 hover:text-pink-500 cursor-pointer'>
                  <BiLike size={20} />
                  <span>0</span>
                </div>

                <div className='items-center text-slate-500 hover:text-black cursor-pointer'>
                  <BiBookmark size={20} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default RenderComments;
