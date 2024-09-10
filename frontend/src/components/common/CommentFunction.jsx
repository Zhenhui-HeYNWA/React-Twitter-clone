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

import CommentsControls from './Comments/CommentsControls';
import { IoCloseSharp } from 'react-icons/io5';

const CommentFunction = ({ postComment, size }) => {
  const { data: authUser } = useQuery({
    queryKey: ['authUser'],
  });

  const [imgs, setImgs] = useState([]);
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

  const isSubComment = postComment?.parentId !== null;

  const onEmojiSelect = (emoji) => {
    setReplies((prevText) => prevText + emoji.native);
  };

  const handleImgChange = (e) => {
    const files = e.target.files;
    if (files && files.length + imgs.length <= 4) {
      const newImgs = [...imgs];
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          newImgs.push(reader.result);
          if (newImgs.length <= 4) {
            setImgs(newImgs);
          } else {
            toast.error('You can upload up to 4 images.');
          }
        };
        reader.readAsDataURL(file);
      });
    } else {
      toast.error('You can upload up to 4 images.');
    }
  };
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
        imgs: currentComment.parentId.imgs,
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
    replyComment({ commentId, text: reply, imgs: imgs.length > 0 ? imgs : [] });
    setReplies('');
    setImgs([]);
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
        <div
          className={`flex justify-between  w-full ${
            size === 'lg' ? '' : 'mt-3'
          } `}>
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
                <BiComment
                  className={`${
                    size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'
                  }  text-slate-500 group-hover:text-sky-400`}
                />
                <span
                  className={`${
                    size === 'lg' ? 'text-base' : 'text-sm'
                  } text-slate-500 group-hover:text-sky-400`}>
                  {postComment?.replies?.length}
                </span>
              </div>
            )}
          </div>

          {/* {isSubComment && ()} */}
          <dialog
            id={`ReplyComments_modal${postComment?._id}`}
            className='modal  outline-none '>
            <div className='modal-box rounded-xl border  bg-gray-100 border-gray-400 dark:bg-[#15202B] overflow-visible'>
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
                    <div className='mt-2 text-gray-500 bg-blue-950'>
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
                <div className='flex flex-col w-full'>
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

                  {imgs.length > 0 && (
                    <div className='w-full overflow-x-auto '>
                      <div className='flex gap-2'>
                        {imgs.map((img, index) => (
                          <div
                            key={img}
                            className='relative flex-shrink-0 w-fit h-fit'
                            style={{
                              flex: imgs.length > 1 ? '0 0 9rem' : '0 0 auto',
                            }}>
                            <IoCloseSharp
                              className='absolute top-0 right-0 text-white bg-gray-800 rounded-full w-5 h-5 cursor-pointer'
                              onClick={() => {
                                setImgs(imgs.filter((_, i) => i !== index));
                              }}
                            />
                            <img
                              src={img}
                              className={
                                imgs.length > 1
                                  ? `w-44 h-48 object-cover rounded-2xl`
                                  : ` w-28 h-32 sm:w-32 sm:h-36 mx-auto  object-cover rounded-2xl`
                              }
                              alt={`Preview ${index + 1}`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <CommentsControls
                    isSending={isReplying}
                    onEmojiSelect={onEmojiSelect}
                    onImgsChange={handleImgChange}
                  />
                </div>
                {/* <button className='btn justify-end btn-primary rounded-full btn-sm text-white px-4'>
                  {replyComment.isCommenting ? (
                    <span className=' flex  gap-1 items-center disabled'>
                      Posting <LoadingSpinner size='md' />
                    </span>
                  ) : (
                    'Reply '
                  )}
                </button> */}
              </form>
            </div>
            <form method='dialog' className='modal-backdrop'>
              <button className='outline-none'>close</button>
            </form>
          </dialog>

          <div className='flex items-center group cursor-pointer gap-1 w-12 '>
            <BiRepost
              className={`${
                size === 'lg' ? 'w-7 h-7' : 'h-6 w-6'
              } text-slate-500 group-hover:text-green-500`}
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
                  size={`${size === 'lg' ? 18 : 15}`}
                  className={` cursor-pointer ${
                    commentLiked
                      ? 'text-pink-500'
                      : 'text-slate-500 group-hover:text-pink-500'
                  }`}
                />
                <span
                  className={` ${size === 'lg' ? 'text-base' : 'text-sm'} ${
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
          <div className='flex flex-row gap-2 items-center'>
            <div
              className='flex  group items-center'
              onClick={() => handleBookMarkComment(postComment._id)}>
              {isMarking && <LoadingSpinner size='sm' />}
              {!isMarking && markedComment && (
                <FaBookmark
                  size={`${size === 'lg' ? 18 : 15}`}
                  className=' cursor-pointer '
                />
              )}
              {!isMarking && !markedComment && (
                <FaRegBookmark
                  size={`${size === 'lg' ? 18 : 15}`}
                  className=' text-slate-500 cursor-pointer group-hover:fill-black'
                />
              )}
            </div>
            {/* Share Link Function */}
            <div className=' dropdown dropdown-top dropdown-end '>
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
                    handleShareLink(
                      `/${postComment?.postId}/comment/${postComment?.user?.username}/${postComment?._id}`
                    )
                  }
                  // onClick={
                  //   () => handleShareLink(postComment) // Pass the whole postComment object
                  // }
                >
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
