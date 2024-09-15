import { useQuery } from '@tanstack/react-query';
import { FaTrash } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import LoadingSpinner from './LoadingSpinner';

import { formatPostDate } from '../../utils/date';
import useCommentMutations from '../../hooks/useCommentMutations';
import { useEffect, useState } from 'react';
import CommentFunction from './CommentFunction';
import RenderImg from './RenderImg/RenderImg';

const RenderSubComments = ({ pageType, postComment }) => {
  const { data: authUser } = useQuery({ queryKey: ['authUser'] });
  const [mentionedUsersExistence, setMentionedUsersExistence] = useState({});
  console.log('postComment', postComment);

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

  useEffect(() => {
    const mentionedUsernames = postComment?.text
      ?.match(/@\w+/g)
      .map((m) => m.substring(1));

    if (mentionedUsernames.length > 0) {
      fetchMentionedUsersExistence(mentionedUsernames).then(
        setMentionedUsersExistence
      );
    }
  }, [postComment]);

  const highlightMentions = (text) => {
    const regex = /@\w+/g;
    const handleClick = (e, path) => {
      e.stopPropagation();

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
          key={index}
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
  const [structuredComments, setStructuredComments] = useState([]);

  const isMyComment = authUser._id === postComment?.user._id;
  const isSubComment = postComment?.user._id !== null;

  const hasParentComment =
    postComment?.parentId && postComment.parentId.user !== null;

  const navigate = useNavigate();
  const formattedPostDate = postComment
    ? formatPostDate(postComment.createdAt)
    : '';

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
        likes: currentComment.parentId.likes,
        postId: currentComment.parentId.postId,
      });
      currentComment = currentComment.parentId;
    }

    return result.reverse();
  }

  useEffect(() => {
    if (isSubComment) {
      const structured = getParentCommentsIterative(postComment);
      setStructuredComments(structured);
    }
  }, [postComment, isSubComment]);

  const handleNavigate = (id) => {
    navigate(
      `/${id}/comment/${postComment?.user?.username}/${postComment?._id}`
    );
  };

  const { deleteComment, isCommentDeleting } = useCommentMutations();

  const handleDeleteComment = (commentId) => {
    if (isCommentDeleting) return;
    deleteComment({ commentId });
  };
  console.log(postComment);

  return (
    <div className='border-b  border-gray-200 dark:border-gray-700 flex flex-col flex-1 justify-center py-2 '>
      <div className='flex flex-col gap-1 justify-between px-4 '>
        {hasParentComment &&
          pageType === 'replies' &&
          structuredComments.map((structuredComment, index) => {
            const isStructuredCommentDeleted =
              structuredComment.isDeleted === true;
            if (isStructuredCommentDeleted) {
              return (
                <div key={structuredComment._id + '-deleted-' + index}>
                  <div className='flex flex-col gap-2 items-start mt-1 relative h-20  '>
                    <div className='bg-gray-200 rounded-md p-3  dark:bg-[#1E2732]'>
                      This comment has been deleted by author.
                    </div>
                    <div className=' absolute bottom-0  left-6  w-0.5 h-1/3  dark:bg-slate-700  bg-gray-400 mt-2'></div>
                  </div>
                </div>
              );
            }
            return (
              <div key={structuredComment._id + '-structured-' + index}>
                <div className='flex gap-4'>
                  <div className='flex flex-col items-center'>
                    <div className='avatar'>
                      {/* Avatar */}
                      <Link
                        to={`/profile/${structuredComment?.user?.username}`}
                        className='w-12 h-12 rounded-full overflow-hidden block'>
                        <img
                          src={
                            structuredComment?.user?.profileImg ||
                            '/avatar-placeholder.png'
                          }
                          alt='Profile'
                        />
                      </Link>
                    </div>
                    <div className='w-0.5 dark:bg-slate-700  bg-gray-400  h-full mt-1 '></div>
                  </div>

                  <div className='flex flex-col w-full gap-1'>
                    <div className='flex items-center justify-between'>
                      <div className='flex flex-row items-center justify-start gap-1'>
                        <Link
                          to={`/profile/${structuredComment?.user?.username}`}
                          className='font-bold truncate'>
                          {structuredComment?.user?.fullName}
                        </Link>

                        {/* username */}
                        <span className='text-gray-500 flex gap-1 text-base truncate'>
                          <Link
                            to={`/profile/${structuredComment?.user?.username}`}>
                            @{structuredComment?.user?.username}
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
                                onClick={() =>
                                  handleDeleteComment(structuredComment?._id)
                                }
                              />
                            )}

                            {isCommentDeleting && <LoadingSpinner size='sm' />}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* comment text section */}
                    <div
                      className='flex flex-col overflow-hidden'
                      onClick={() => handleNavigate(structuredComment?.postId)}>
                      <span className='text-lg whitespace-pre-wrap'>
                        {structuredComment?.text}
                      </span>
                    </div>

                    {/* comment functions section */}

                    <CommentFunction postComment={structuredComment} />
                  </div>
                </div>
              </div>
            );
          })}
        <div className='flex gap-4'>
          <div className='flex flex-col  items-center'>
            <div className=' avatar '>
              {/* Avatar */}
              <Link
                to={`/profile/${postComment?.user?.profileImg}`}
                className='w-12 h-12 rounded-full overflow-hidden block'>
                <img
                  src={
                    postComment?.user?.profileImg || '/avatar-placeholder.png'
                  }
                />
              </Link>
            </div>
          </div>

          <div className='flex flex-col w-full gap-1'>
            <div className='flex items-center justify-between '>
              <div className='flex flex-row items-center justify-start gap-1'>
                <span className='truncate'>
                  <Link
                    to={`/profile/${postComment?.user.username}`}
                    className='font-bold '>
                    {postComment?.user.fullName}
                  </Link>
                </span>

                {/* username */}
                <span className='text-gray-500 flex gap-1 text-base truncate'>
                  <Link to={`/profile/${postComment?.user?.username}`}>
                    @{postComment?.user.username}
                  </Link>
                </span>
                <span className='text-base text-gray-500'>·</span>
                <span className='text-base text-gray-500 flex gap-1'>
                  {formattedPostDate}
                </span>
              </div>
              {isMyComment && (
                <div className='flex justify-end items-center'>
                  <span className='flex justify-end flex-1'>
                    {!isCommentDeleting && (
                      <FaTrash
                        className='cursor-pointer hover:text-red-500'
                        onClick={() => handleDeleteComment(postComment._id)}
                      />
                    )}

                    {isCommentDeleting && <LoadingSpinner size='sm' />}
                  </span>
                </div>
              )}
            </div>
            {!hasParentComment && pageType == 'replies' && (
              <span>
                Replying to
                <Link
                  className=' mention-highlight text-sky-500 hover:underline hover:text-sky-700'
                  to={`/profile/${postComment?.postId?.user?.username}`}>
                  @{postComment?.postId?.user?.username}
                </Link>
              </span>
            )}
            {/* comment text section */}
            <div
              className='flex flex-col overflow-hidden'
              onClick={() => handleNavigate(postComment?.postId._id)}>
              <span className='text-lg whitespace-pre-wrap'>
                {highlightMentions(postComment?.text)}
              </span>
              {postComment.imgs.length > 0 && (
                <div className='rounded-xl overflow-hidden w-fit mb-3'>
                  <RenderImg imgs={postComment.imgs} size={'md'} />
                </div>
              )}
            </div>

            {/* comment functions section*/}
            <CommentFunction postComment={postComment} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RenderSubComments;
