import { useRef, useState } from 'react';
import usePostMutations from '../../hooks/usePostMutations';
import { useParams } from 'react-router-dom';
import { CiImageOn } from 'react-icons/ci';
import { BsEmojiSmileFill } from 'react-icons/bs';
import useCommentMutations from '../../hooks/useCommentMutations';

const CreateCommentForm = ({
  post,
  authUser,
  CommentUsername,
  type,
  commentId,
  comment,
}) => {
  const { postId } = useParams();
  console.log(type);

  const [replyPostComment, setReplyPostComment] = useState('');

  const { commentPostSimple, isCommenting } = usePostMutations(postId);

  const { replyComment, isReplying } = useCommentMutations();
  const radioRef = useRef(null);
  const handleTextareaClick = () => {
    setShowNav(true);
    if (radioRef.current) {
      radioRef.current.checked = true; // Simulate click to open accordion
    }
  };

  console.log('123231', comment);
  function getUniqueUsernames(data) {
    const usernames = new Set();

    function extractUsernames(obj) {
      if (obj?.user?.username) {
        usernames.add(obj.user.username);
      }

      if (obj?.replies?.length > 0) {
        obj.replies.forEach((reply) => extractUsernames(reply));
      }

      if (obj?.parentId) {
        extractUsernames(obj.parentId);
      }
    }

    extractUsernames(data);

    return Array.from(usernames);
  }

  const uniqueUsernames = getUniqueUsernames(comment);
  console.log(uniqueUsernames);
  const handleCommentSubmit = (e) => {
    e.preventDefault();
    console.log(replyPostComment);
    if (type === 'replyToComment') {
      if (isReplying) return;
      replyComment({ commentId, text: replyPostComment });
      setReplyPostComment('');
    } else {
      if (isCommenting) return;
      commentPostSimple({ postId: postId, text: replyPostComment });
      setReplyPostComment('');

      const modal = document.getElementById('comments_modal' + postId);
      if (modal) {
        modal.close();
      }
    }
  };
  const [showNav, setShowNav] = useState(false);
  return (
    <div className='transition-all duration-1000 ease-in-out'>
      <div
        className={`px-16  hidden md:flex justify-start items-center text-slate-500 transition-opacity duration-300 ease-in-out ${
          showNav ? 'opacity-100' : 'opacity-0'
        }`}>
        Replying to
        {CommentUsername && CommentUsername.length > 0 ? (
          <p className='text-sky-500 ml-1'>
            @{uniqueUsernames[0]}
            {uniqueUsernames.length > 1 && `, @${uniqueUsernames[1]}`}
            {uniqueUsernames.length > 2 &&
              `, and ${uniqueUsernames.length - 2} others`}
          </p>
        ) : (
          <p className='text-sky-500'> @{post?.user.username}</p>
        )}
      </div>

      <div className='hidden md:flex items-start gap-4 border-b border-gray-200 dark:border-gray-700 p-4'>
        <div className='avatar flex'>
          <div className='w-12 h-12 rounded-full'>
            <img
              src={authUser?.profileImg || '/avatar-placeholder.png'}
              alt='Profile'
              className='transition-all duration-300 ease-in-out'
            />
          </div>
        </div>

        <form
          className={`flex gap-2 w-full  ${showNav ? 'flex-col' : 'flex-row'}`}
          onSubmit={handleCommentSubmit}>
          <textarea
            className='group textarea w-full p-0 text-2xl resize-none border-none focus:outline-none bg-inherit'
            placeholder='Post your reply '
            value={replyPostComment}
            onChange={(e) => setReplyPostComment(e.target.value)}
            onClick={handleTextareaClick}
          />

          <div className='flex flex-row justify-between p-2'>
            <div
              className={`flex justify-between py-2 transition-all duration-1000 ease-in-out ${
                showNav
                  ? 'flex-row opacity-100 max-h-full'
                  : 'flex-row-reverse opacity-0 max-h-0'
              }`}>
              <div className='nav flex gap-1 items-center'>
                <CiImageOn className='fill-primary w-6 h-6 cursor-pointer transition-all duration-1000 ease-in-out' />
                <BsEmojiSmileFill className='fill-primary w-5 h-5 cursor-pointer transition-all duration-1000 ease-in-out' />
              </div>
              <input type='file' hidden accept='image/*' />
            </div>
            <button
              disabled={isCommenting}
              className='btn btn-primary rounded-full btn-sm text-white px-4'>
              {isCommenting || isReplying ? 'Replying' : 'Reply'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCommentForm;
