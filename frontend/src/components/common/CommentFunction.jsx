import { useEffect, useState } from 'react';
import LoadingSpinner from './LoadingSpinner';
import { BiComment, BiRepost } from 'react-icons/bi';
import { FaBookmark, FaRegBookmark, FaRegHeart } from 'react-icons/fa';
import useCommentMutations from '../../hooks/useCommentMutations';
import { formatPostDate } from '../../utils/date';
import { useQuery } from '@tanstack/react-query';
import { RiShare2Line } from 'react-icons/ri';
import { AiOutlineLink } from 'react-icons/ai';
import toast from 'react-hot-toast';

const CommentFunction = ({ postComment }) => {
  const { data: authUser } = useQuery({
    queryKey: ['authUser'],
  });

  const [reply, setReplies] = useState('');
  const [structuredComments, setStructuredComments] = useState([]);
  const {
    replyComment,
    isReplying,
    likeUnlikeComment,
    isLiking,
    bookmarkComment,
    isMarking,
  } = useCommentMutations();

  console.log('postComment', postComment);
  console.log(structuredComments);
  const isSubComment = postComment?.parentId !== null;
  console.log(isSubComment);

  const commentLiked = authUser.likes.some(
    (like) => like.onModel === 'Comment' && like.item === postComment._id
  );
  const markedComment = authUser.bookmarks.some(
    (bookmark) =>
      bookmark.onModel === 'Comment' && bookmark.item === postComment._id
  );

  function getParentCommentsIterative(postComment) {
    const result = [];

    let currentComment = postComment;
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
      const structured = getParentCommentsIterative(postComment);
      setStructuredComments(structured);
    }
  }, [postComment, isSubComment]);

  //ReplyComment
  const handleReplyComment = (e, commentId) => {
    e.preventDefault();
    if (isReplying) return;
    replyComment({ commentId, text: reply });
    setReplies('');
    const modal = document.getElementById(
      `ReplyComments_modal${postComment?._id}`
    );
    if (modal) {
      modal.close();
    }
  };
  const handleLikeUnlikeComment = (commentId) => {
    if (isLiking) return;
    likeUnlikeComment(commentId);
  };

  const handleBookMarkComment = (commentId) => {
    if (isMarking) return;
    bookmarkComment(commentId);
  };

  const handleShareLink = async (url) => {
    const content = window.location.origin + url;

    try {
      await navigator.clipboard.writeText(content);
      const elem = document.activeElement;
      if (elem) {
        elem?.blur();
      }
      toast.success('Post link Copied');
    } catch (error) {
      const elem = document.activeElement;
      if (elem) {
        elem?.blur();
      }
      toast.error('Failed to Copy');
      console.log(error);
    }
  };
  return (
    <>
      {postComment ? (
        <div className='flex flex-row items-center justify-between '>
          <div
            className='flex gap-1 items-center cursor-pointer group '
            onClick={() =>
              document
                .getElementById('ReplyComments_modal' + postComment?._id)
                .showModal()
            }>
            {isReplying && <LoadingSpinner size='sm' />}
            {!isReplying && (
              <div className='flex items-center gap-1 w-12 '>
                <BiComment className='w-4 h-4 text-slate-500 group-hover:text-sky-400' />
                <span className='text-sm text-slate-500 group-hover:text-sky-400'>
                  {postComment?.replies?.length}
                </span>
              </div>
            )}
          </div>

          {/* {isSubComment && ()} */}
          <dialog
            id={`ReplyComments_modal${postComment?._id}`}
            className='modal  outline-none '>
            <div className='modal-box rounded-xl border  bg-gray-100 border-gray-400 dark:bg-[#15202B]'>
              <div className='flex flex-row gap-2 max-h-60 overflow-auto   '>
                <div className='flex flex-col items-center '>
                  <div className='h-10 w-10 rounded-full'>
                    <img
                      src={postComment?.user?.profileImg}
                      alt=''
                      className='h-10 w-10 rounded-full'
                    />
                  </div>
                  <div className='  w-0.5 h-full  mt-0.5 dark:bg-slate-700  bg-gray-400 '></div>
                </div>

                <div className=' flex flex-row items-center'>
                  <div className=' flex flex-col  justify-start '>
                    <div className=' flex flex-row gap-2'>
                      <div className=' font-bold truncate'>
                        {postComment?.user?.fullName}
                      </div>
                      <div className='text-gray-500 overflow-hidden'>
                        @{postComment?.user?.username}
                      </div>
                      <div className='text-gray-500'>·</div>
                      <div className='text-gray-500'>
                        {formatPostDate(postComment?.createdAt)}
                      </div>
                    </div>
                    <div className='text-base '>{postComment?.text}</div>
                    <div className='mt-2 text-gray-500'>
                      Replying to
                      <span className='text-sky-600'>
                        @{postComment?.user?.username}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <form
                className='flex flex-row gap-2 mt-1 items-center dark:bg-[#15202B] justify-between '
                onSubmit={(e) => handleReplyComment(e, postComment?._id)}>
                <div className='flex flex-row gap-2 '>
                  {' '}
                  <div className='h-10 w-10 rounded-full overflow-auto '>
                    <img
                      src={authUser.profileImg}
                      alt=''
                      className='h-10 w-10 rounded-full '
                    />
                  </div>
                  <textarea
                    className='textarea items-center p-0 w-2/3 h-2 bg-gray-100 dark:bg-[#15202B]   rounded text-md resize-none  focus:outline-none '
                    placeholder='Post your reply'
                    value={reply}
                    onChange={(e) => setReplies(e.target.value)}
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

          <div className='flex items-center group cursor-pointer gap-1 w-12 '>
            <BiRepost
              className={`w-6 h-6 text-slate-500 group-hover:text-green-500`}
            />
            <span
              className='text-sm font-normal group-hover:text-green-500 
      text-slate-500'>
              0
            </span>
          </div>

          {/* like post  */}
          <div
            className='flex gap-1 items-center group cursor-pointer w-12'
            onClick={() => handleLikeUnlikeComment(postComment._id)}>
            {isLiking ? (
              <LoadingSpinner size='sm' />
            ) : (
              <>
                <FaRegHeart
                  className={`w-4 h-4 cursor-pointer ${
                    commentLiked
                      ? 'text-pink-500'
                      : 'text-slate-500 group-hover:text-pink-500'
                  }`}
                />
                <span
                  className={`text-sm ${
                    commentLiked
                      ? 'text-pink-500'
                      : 'text-slate-500 group-hover:text-pink-500'
                  }`}>
                  {postComment?.likes?.length}
                </span>
              </>
            )}
          </div>
          {/* bookmark */}
          <div className='flex flex-row gap-2'>
            <div
              className='flex  group items-center'
              onClick={() => handleBookMarkComment(postComment._id)}>
              {isMarking && <LoadingSpinner size='sm' />}
              {!isMarking && markedComment && (
                <FaBookmark size={15} className=' cursor-pointer ' />
              )}
              {!isMarking && !markedComment && (
                <FaRegBookmark
                  size={15}
                  className=' text-slate-500 cursor-pointer group-hover:fill-black'
                />
              )}
            </div>
            {/* Share Link Function */}
            <div className=' dropdown dropdown-top dropdown-end '>
              <RiShare2Line
                size={18}
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
                    handleShareLink(
                      `/${postComment.postId._id}/comment/${postComment?.user?.username}/${postComment?._id}`
                    )
                  }>
                  <>
                    <span className='text-slate-700 dark:text-slate-200'>
                      {' '}
                      <AiOutlineLink className='w-5 h-5 text-slate-700 dark:text-slate-200' />
                      Copy link
                    </span>
                  </>
                </li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        ''
      )}
    </>
  );
};

export default CommentFunction;
