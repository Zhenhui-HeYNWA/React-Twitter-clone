import { useRef, useState } from 'react';
import usePostMutations from '../../hooks/usePostMutations';
import { useParams } from 'react-router-dom';

import useCommentMutations from '../../hooks/useCommentMutations';
import CreatePostControls from './PostCommon/CreatePostControls';
import toast from 'react-hot-toast';
import { IoCloseSharp } from 'react-icons/io5';
import CustomMention from './MentionComponent';

const CreateCommentForm = ({
  post,
  authUser,
  CommentUsername,
  type,
  commentId,
  comment,
}) => {
  const { postId } = useParams();

  const [replyPostComment, setReplyPostComment] = useState('');
  const [imgs, setImgs] = useState([]);
  const { commentPostSimple, isCommenting } = usePostMutations(postId);

  const { replyComment, isReplying } = useCommentMutations();
  const radioRef = useRef(null);

  const handleTextareaClick = () => {
    setShowNav(true);
    if (radioRef.current) {
      radioRef.current.checked = true; // Simulate click to open accordion
    }
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
  const handleEmojiSelect = (emoji) => {
    setReplyPostComment((prevText) => prevText + emoji.native);
  };

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

  const handleCommentSubmit = (e) => {
    e.preventDefault();

    if (type === 'replyToComment') {
      if (isReplying) return;
      replyComment({ commentId, text: replyPostComment, imgs: imgs });
      setReplyPostComment('');
      setImgs([]);
    } else {
      if (isCommenting) return;
      commentPostSimple({ postId: postId, text: replyPostComment, imgs: imgs });
      setReplyPostComment('');
      setImgs([]);
      const modal = document.getElementById('comments_modal' + postId);
      if (modal) {
        modal.close();
      }
    }
  };
  const [showNav, setShowNav] = useState(false);
  return (
    <div className='transition-all duration-1000 ease-in-out'>
      {showNav && (
        <div
          className={`px-16  hidden md:flex justify-start items-center text-slate-500 transition-opacity duration-300 ease-in-out ${
            showNav ? 'opacity-100' : 'opacity-0'
          }`}>
          <span>Replying to&nbsp; </span>{' '}
          {CommentUsername && CommentUsername.length > 0 ? (
            <p className='text-sky-500 ml-1'>
              @ {uniqueUsernames[0]}
              {uniqueUsernames.length > 1 && `, @ ${uniqueUsernames[1]}`}
              {uniqueUsernames.length > 2 &&
                `, and ${uniqueUsernames.length - 2} others`}
            </p>
          ) : (
            <p className='text-sky-500'>
              <span> </span>@{post?.user.username}
            </p>
          )}
        </div>
      )}

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
          className={`flex gap-2 w-full  flex-col`}
          onSubmit={handleCommentSubmit}>
          <div className='quote-post-container'>
            <CustomMention
              className='group textarea w-full p-0 text-2xl resize-none border-none focus:outline-none bg-inherit'
              placeholderText='Post your reply '
              value={replyPostComment}
              onChange={(e) => setReplyPostComment(e.target.value)}
              onClick={handleTextareaClick}
            />
          </div>
          <div className='flex gap-2'>
            {imgs.map((img, index) => (
              <div
                key={img}
                className='relative flex-shrink-0'
                style={{ flex: imgs.length > 1 ? '0 0 10rem' : '0 0 auto' }}>
                <IoCloseSharp
                  className='absolute top-1 right-2 text-white bg-gray-800 rounded-full w-5 h-5 cursor-pointer'
                  onClick={() => {
                    setImgs(imgs.filter((_, i) => i !== index));
                  }}
                />
                <img
                  src={img}
                  className={
                    imgs.length > 1
                      ? `w-full h-full object-cover rounded-2xl`
                      : ` w-36 h-44 sm:w-64 sm:h-72 mx-auto  object-cover rounded-2xl`
                  }
                  alt={`Preview ${index + 1}`}
                />
              </div>
            ))}
          </div>
          <div
            className={`flex justify-between  transition-all duration-1000 ease-in-out ${
              showNav
                ? 'flex-row opacity-100 max-h-full'
                : 'flex-row-reverse opacity-0 max-h-0'
            }`}></div>

          <CreatePostControls
            type={'quote'}
            onEmojiSelect={handleEmojiSelect}
            isPosting={isCommenting}
            onImgsChange={handleImgChange}
          />
        </form>
      </div>
    </div>
  );
};

export default CreateCommentForm;
