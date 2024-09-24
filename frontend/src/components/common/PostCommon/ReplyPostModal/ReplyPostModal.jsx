import { BsEmojiSmileFill } from 'react-icons/bs';
import CustomMention from '../../MentionComponent';
import { CiImageOn } from 'react-icons/ci';
import data from '@emoji-mart/data';
import { useRef, useState } from 'react';
import { IoCloseSharp } from 'react-icons/io5';
import Picker from '@emoji-mart/react';
import LoadingSpinner from '../../LoadingSpinner';
import toast from 'react-hot-toast';
import usePostMutations from '../../../../hooks/usePostMutations';
import RenderImg from '../../RenderImg/RenderImg';
import './ReplyPostModal.css';

const ReplyPostModal = ({ post, comments, theme, postId }) => {
  const [imgs, setImgs] = useState([]);
  const [comment, setComment] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const imgRef = useRef(null);
  const handleEmojiSelect = (emoji) => {
    setComment((prevText) => prevText + emoji.native);
  };

  const { commentPostAdvanced, isPostCommenting } = usePostMutations(postId);

  // Handle comment submission
  const handlePostComment = (e) => {
    e.preventDefault();
    if (isPostCommenting) return;
    commentPostAdvanced(
      { postId: postId, text: comment, imgs: imgs },
      {
        onSuccess: () => {
          setComment(''); // Clear the comment input after successful submission
          setImgs([]);
          const modal = document.getElementById('comments_modal' + post._id);
          if (modal) {
            modal.close();
          }
        },
      }
    );
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
  return (
    <dialog
      id={`comments_modal${post?._id}`}
      className=' ReplyPostModal modal  modal-middle border-none outline-none  '>
      <div className='modal-box rounded-xl border bg-gray-100 dark:bg-[#15202B]  border-gray-400 overflow-visible'>
        <h3 className='font-bold text-lg mb-4'>COMMENTS</h3>

        <div className='flex flex-col gap-3 max-h-40 overflow-scroll'>
          {post?.comments?.length === 0 && (
            <p className='text-sm text-slate-500'>
              No comments yet 🤔 Be the first one 😉
            </p>
          )}

          {comments?.map(
            (comment) =>
              comment && ( // Ensure comment is not undefined
                <div key={comment?._id} className='flex gap-2 items-start '>
                  <div className='avatar'>
                    <div className='w-8 rounded-full'>
                      <img
                        src={
                          comment?.user?.profileImg || '/avatar-placeholder.png'
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
                    {comment?.imgs?.length > 0 && ( // Add optional chaining to comment
                      <div className=' rounded-xl overflow-hidden w-fit mb-2'>
                        <RenderImg imgs={comment?.imgs} size={'sm'} />
                      </div>
                    )}
                    <div className='text-sm'>{comment?.text}</div>
                  </div>
                </div>
              )
          )}
        </div>
        <form
          className='flex  flex-col gap-2 items-center mt-4 border-t border-gray-300  dark:border-gray-800  pt-2'
          onSubmit={handlePostComment}>
          <div className='quote-post-container w-full'>
            <CustomMention
              className='textarea w-full p-1 rounded text-md resize-none border focus:outline-none  bg-gray-100 dark:bg-[#15202B]  border-gray-100  dark:border-gray-800'
              placeholderText='Add a comment...'
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
          {imgs?.length > 0 && (
            <div className='w-full overflow-x-auto '>
              <div className='flex gap-2'>
                {imgs?.map((img, index) => (
                  <div
                    key={img}
                    className='relative flex-shrink-0'
                    style={{
                      flex: imgs?.length > 1 ? '0 0 10rem' : '0 0 auto',
                    }}>
                    <IoCloseSharp
                      className='absolute top-1 right-2 text-white bg-gray-800 rounded-full w-5 h-5 cursor-pointer'
                      onClick={() => {
                        setImgs(imgs?.filter((_, i) => i !== index));
                      }}
                    />
                    <img
                      src={img}
                      className={` w-36 h-44 mx-auto  object-cover rounded-2xl`}
                      alt={`Preview ${index + 1}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className=' justify-between flex w-full'>
            <div className=' flex gap-1 items-center  relative'>
              <CiImageOn
                className='fill-primary w-6 h-6 cursor-pointer'
                onClick={() => imgRef.current.click()}
              />

              <BsEmojiSmileFill
                className='fill-primary w-5 h-5 cursor-pointer'
                onClick={() => setShowEmojiPicker((prev) => !prev)}
              />

              {showEmojiPicker && (
                <div className='modal-picker absolute top-6  md:top-6 md:left-10 z-10  '>
                  <Picker
                    data={data}
                    onEmojiSelect={handleEmojiSelect}
                    theme={theme === 'dark' ? 'dark' : 'light'}
                    maxFrequentRows={0}
                    perLine={7}
                    emojiSize={20}
                    searchPosition={'none'}
                    previewPosition={'none'}
                  />
                </div>
              )}
            </div>
            <input
              type='file'
              hidden
              ref={imgRef}
              accept='image/*'
              onChange={handleImgChange}
              multiple
            />
            <button className='btn btn-primary rounded-full btn-sm text-white px-4'>
              {isPostCommenting ? <LoadingSpinner size='md' /> : 'Reply'}
            </button>
          </div>
        </form>
      </div>
      <form method='dialog' className='modal-backdrop'>
        <button className='outline-none'>close</button>
      </form>
    </dialog>
  );
};
export default ReplyPostModal;
