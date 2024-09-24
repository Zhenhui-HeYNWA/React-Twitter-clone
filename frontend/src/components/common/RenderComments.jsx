import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import LoadingSpinner from './LoadingSpinner';
import { FaTrash } from 'react-icons/fa';

import { formatDateTime } from '../../utils/date';
import { useEffect, useState } from 'react';
import useCommentMutations from '../../hooks/useCommentMutations';
import CommentFunction from './Comments/CommentFunction';

import RenderImg from './RenderImg/RenderImg';
import RenderText from './PostCommon/RenderText';
import PostAuthorDetail from './PostCommon/PostAuthorDetail';

const RenderComments = ({ comment }) => {
  const { data: authUser } = useQuery({
    queryKey: ['authUser'],
  });

  const [structuredComments, setStructuredComments] = useState([]);

  const { deleteComment, isCommentDeleting } = useCommentMutations();

  const isSubComment = comment?.parentId !== null;

  const isMyComment = authUser._id === comment?.user._id;

  const handleModalImgClick = (index) => {
    document.getElementById(`my_modal_${index}`).showModal();
  };

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
        imgs: currentComment.parentId.imgs,
        replies: currentComment.parentId.replies,
        createdAt: currentComment.parentId.createdAt,
        isDeleted: currentComment.parentId.isDeleted,
        likes: currentComment.parentId.likes,
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

  const handleDeleteComment = (commentId) => {
    if (isCommentDeleting) return;

    deleteComment({ commentId });
  };

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
                    <div className='bg-gray-200 rounded-md p-3  dark:bg-[#1E2732]'>
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
                              <PostAuthorDetail
                                postUser={structuredComment?.user}
                                date={structuredComment?.createdAt}
                                type={'main'}
                              />

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
                              {structuredComment.imgs.length > 0 && (
                                <div className='rounded-xl overflow-hidden w-fit mb-3'>
                                  <RenderImg
                                    imgs={structuredComment.imgs}
                                    size={'md'}
                                  />
                                </div>
                              )}
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
              <div className=' flex flex-row gap-4  items-center   w-full'>
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
                    <PostAuthorDetail postUser={comment?.user} />
                    {isMyComment && (
                      <div className=' justify-end  '>
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
                </div>
              </div>
            </div>

            {/* Comment text section */}

            <div className='flex flex-col gap-y-2 w-full'>
              <div className='my-1 text-lg whitespace-pre-wrap'>
                <RenderText text={comment?.text} />
              </div>
              {comment?.imgs.length > 0 && (
                <div className='rounded-xl overflow-hidden w-fit mb-3'>
                  <RenderImg
                    imgs={comment?.imgs}
                    size={'lg'}
                    onImgClick={handleModalImgClick}
                  />
                </div>
              )}

              <div className='text-gray-500'>
                {formatDateTime(comment?.createdAt)}
              </div>
              <div className='border-y-2  dark:border-gray-700 py-2'>
                <CommentFunction postComment={comment} size={'lg'} />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default RenderComments;
