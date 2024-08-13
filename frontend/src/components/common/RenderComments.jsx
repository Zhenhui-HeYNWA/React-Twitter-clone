import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import LoadingSpinner from './LoadingSpinner';
import { FaTrash } from 'react-icons/fa';
import { BiBookmark, BiComment, BiLike, BiRepost } from 'react-icons/bi';

import { formatDateTime, formatPostDate } from '../../utils/date';
import { useEffect, useState } from 'react';
import useCommentMutations from '../../hooks/useCommentMutations';
import CommentFunction from './CommentFunction';

const RenderComments = ({ comment }) => {
  const { data: authUser } = useQuery({
    queryKey: ['authUser'],
  });

  // // const [isLoading, setIsLoading] = useState(true);
  // console.log(isLoading);
  const [structuredComments, setStructuredComments] = useState([]);
  const [replyToComment, setReplyToComment] = useState('');

  const { replyComment, isReplying, deleteComment, isCommentDeleting } =
    useCommentMutations();
  console.log(comment?._id);
  console.log(comment?.parentId);
  console.log('This is comment', comment);
  console.log(comment?.text);

  const isSubComment = comment?.parentId !== null;
  console.log(isSubComment);
  const parentComment = comment?.parentId;
  console.log('parentComment', parentComment);
  // '66b2c4a1f551c0189d6bbcfc', '66b55f4f2920466fd6ee5896'
  const isMyComment = authUser._id === comment?.user._id;

  const isSubCommentAvailable =
    comment?.parentId && comment.parentId.user !== undefined;

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
        isDeleted: currentComment.parentId.isDeleted,
      });
      currentComment = currentComment.parentId;
    }

    return result.reverse();
  }

  useEffect(() => {
    if (isSubComment) {
      const structured = getParentCommentsIterative(comment);
      setStructuredComments(structured);
    }
  }, [comment, isSubComment]);

  const handleReplyComment = (e, commentId) => {
    e.preventDefault();
    if (isReplying) return;
    replyComment({ commentId, text: replyToComment });
    setReplyToComment('');
    const modal = document.getElementById('replyComments_modal' + commentId);
    if (modal) {
      modal.close();
    }
  };

  const handleDeleteComment = (commentId) => {
    if (isCommentDeleting) return;

    deleteComment({ commentId });
  };

  console.log('structuredComments', structuredComments);

  return (
    <>
      <div className='w-full'>
        {isSubComment &&
          structuredComments?.map((structuredComment) => {
            const isMyStructuredComment =
              authUser._id === structuredComment?.user?._id;
            structuredComment;

            if (structuredComment.isDeleted !== false) {
              return (
                <div key={structuredComment._id}>
                  <div className='flex flex-col gap-2 items-start mt-1 relative h-20  '>
                    <div className='bg-gray-200 rounded-md p-3 '>
                      This comment has been deleted by author.
                    </div>
                    <div className=' absolute bottom-0  left-6  w-0.5 h-1/3  dark:bg-slate-700  bg-gray-400 mt-2'></div>
                  </div>
                </div>
              );
            } else {
              return (
                <div key={structuredComment._id}>
                  <div className='flex gap-2 items-start  mt-1 relative'>
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
                            </div>
                            <div
                              className='  w-0.5 h-full mt-0.5
                     dark:bg-slate-700  bg-gray-400 '></div>
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
                                <span className='text-base text-gray-500'>
                                  ·
                                </span>
                                <span className='text-base text-gray-500 flex gap-1'>
                                  {structuredComment?.createdAt}
                                </span>
                              </div>
                              {isMyStructuredComment && (
                                <div className='flex justify-end items-center'>
                                  <span className='flex justify-end flex-1'>
                                    {!isCommentDeleting && (
                                      <FaTrash
                                        className='cursor-pointer hover:text-red-500'
                                        onClick={() =>
                                          handleDeleteComment(
                                            structuredComment?._id
                                          )
                                        }
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
                              <span className='text-lg whitespace-pre-wrap'>
                                {structuredComment?.text}
                              </span>
                            </div>

                            {/* comment functions section*/}
                            <CommentFunction postComment={structuredComment} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }
          })}
        {/* Comment Component */}

        {comment && (
          <div className='flex flex-col gap-2 items-start relative mt-1'>
            <div className=' flex flex-row  w-full'>
              <div className=' flex flex-row gap-3  items-center   w-full'>
                {/* Avatar */}
                <div className='flex flex-col  items-center  '>
                  {isSubComment && !isSubCommentAvailable && (
                    <div className='  w-0.5 h-3 mt-0.5 dark:bg-slate-700  bg-gray-400  mb-1'></div>
                  )}
                  <div className=' avatar'>
                    <Link className='w-12 h-12 rounded-full overflow-hidden block'>
                      <img
                        src={
                          comment?.user.profileImg || '/avatar-placeholder.png'
                        }
                        alt=''
                      />
                    </Link>
                  </div>
                </div>

                <div className='flex flex-col  w-full '>
                  <div className='flex flex-row justify-between items-center w-full'>
                    <div className=' font-bold '>{comment?.user.username}</div>
                    {isMyComment && (
                      <div className='flex  '>
                        <span className='flex justify-end  '>
                          {!isCommentDeleting && (
                            <FaTrash
                              className='cursor-pointer hover:text-red-500'
                              onClick={() => handleDeleteComment(comment?._id)}
                            />
                          )}
                          {isCommentDeleting && <LoadingSpinner size='sm' />}
                        </span>
                      </div>
                    )}
                  </div>

                  <Link to={`/profile/${comment?.user.username}`}>
                    <div className='text-gray-500 flex text-base'>
                      @{comment?.user.fullName}
                    </div>
                  </Link>
                </div>
              </div>
            </div>

            {/* Comment text section */}
            <div className='flex flex-col gap-y-2 w-full'>
              <div className='my-1 text-lg whitespace-pre-wrap'>
                {comment?.text}
              </div>
              <div className='text-gray-500'>
                {formatDateTime(comment?.createdAt)}
              </div>
              <div className='flex flex-row gap-5 items-center justify-between border-y-2  dark:border-gray-700 py-4'>
                <div
                  className='flex flex-row gap-2 items-center text-slate-500 hover:text-sky-400 cursor-pointer'
                  onClick={() =>
                    document
                      .getElementById('replyComments_modal' + comment?._id)
                      .showModal()
                  }>
                  <BiComment size={20} />
                  <span>{comment?.replies?.length}</span>
                </div>
                <dialog
                  id={`replyComments_modal${comment?._id}`}
                  className='modal  outline-none  w-full '>
                  <div className='modal-box rounded border border-gray-400 bg-gray-100 dark:bg-[#15202B]'>
                    <div className='flex flex-row gap-2 max-h-60 overflow-auto w-full  '>
                      <div className='flex flex-col items-center '>
                        <div className='h-10 w-10 rounded-full'>
                          <img
                            src={comment?.user.profileImg}
                            alt=''
                            className='h-10 w-10 rounded-full'
                          />
                        </div>
                        <div className='  w-0.5 h-full  mt-0.5 dark:bg-slate-700  bg-gray-400  '></div>
                      </div>

                      <div className='flex flex-row items-center w-full'>
                        <div className='flex flex-col justify-between w-full'>
                          <div className='flex flex-row gap-2 justify-start items-center w-full'>
                            <div className='font-bold whitespace-nowrap'>
                              {comment?.user.fullName}
                            </div>
                            <div className='text-gray-500 overflow-hidden text-ellipsis whitespace-nowrap max-w-[150px]'>
                              @{comment?.user.username}
                            </div>
                            <div className='text-gray-500'>·</div>
                            <div className='text-gray-500'>
                              {formatPostDate(comment?.createdAt)}
                            </div>
                          </div>
                          <div className='text-base'>@{authUser.username}</div>
                          <div className='mt-2 text-gray-500'>
                            Replying to{' '}
                            <span className='text-sky-600'>
                              @{comment?.user.username}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <form
                      className='flex flex-row gap-2 mt-1 items-center dark:bg-[#15202B] justify-between '
                      onSubmit={(e) => handleReplyComment(e, comment?._id)}>
                      <div className='flex flex-row gap-2 '>
                        {' '}
                        <div className='h-10 w-10 rounded-full overflow-auto '>
                          <img src={authUser.profileImg} alt='' />
                        </div>
                        <textarea
                          className='textarea items-center p-0 w-2/3 h-2 bg-gray-100 dark:bg-[#15202B]   rounded text-md resize-none  focus:outline-none '
                          placeholder='Post your reply'
                          value={replyToComment}
                          onChange={(e) => setReplyToComment(e.target.value)}
                        />
                      </div>

                      <button className='btn justify-end btn-primary rounded-full btn-sm text-white px-4'>
                        {replyComment.isCommenting ? (
                          <span className=' flex  gap-1 items-center disabled'>
                            Posting <LoadingSpinner size='md' />
                          </span>
                        ) : (
                          'Reply'
                        )}
                      </button>
                    </form>
                  </div>
                  <form method='dialog' className='modal-backdrop'>
                    <button className='outline-none'>close</button>
                  </form>
                </dialog>

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
