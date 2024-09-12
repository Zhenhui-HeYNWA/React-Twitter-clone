import { IoCloseSharp } from 'react-icons/io5';
import { formatPostDate } from '../../../utils/date';
import CommentsControls from './CommentsControls';
import { useState } from 'react';
import useCommentMutations from '../../../hooks/useCommentMutations';
import toast from 'react-hot-toast';

const ReplyCommentModal = (comment, authUser) => {
  console.log(comment);

  const [imgs, setImgs] = useState([]);

  const [replyToComment, setReplyToComment] = useState('');

  const { replyComment, isReplying } = useCommentMutations();

  const onEmojiSelect = (emoji) => {
    setReplyToComment((prevText) => prevText + emoji.native);
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

  const handleReplyComment = (e, commentId) => {
    e.preventDefault();
    if (isReplying) return;
    replyComment({
      commentId,
      text: replyToComment,
      imgs: imgs.length > 0 ? imgs : [],
    });
    setReplyToComment('');
    const modal = document.getElementById('replyComments_modal' + commentId);
    if (modal) {
      modal.close();
    }
  };

  return (
    <dialog
      id={`replyComments_modal${comment?._id}`}
      className='modal  outline-none  w-full '>
      <div className='modal-box rounded-xl border border-gray-400 bg-gray-100 dark:bg-[#15202B] overflow-visible'>
        <div className='flex flex-row gap-2 max-h-60 overflow-auto w-full  '>
          <div className='flex flex-col items-center '>
            <div className='h-10 w-10 rounded-full'>
              <img
                src={comment?.user?.profileImg}
                alt=''
                className='h-10 w-10 rounded-full'
              />
            </div>
            <div className='  w-0.5 h-full  mt-0.5 dark:bg-slate-700  bg-gray-400  '></div>
          </div>

          <div className='flex flex-row items-center w-full'>
            <div className='flex flex-col justify-between'>
              <div className='flex flex-row justify-start items-center '>
                <div className='flex flex-row  gap-1 max-w-sm '>
                  <span className='font-bold text-nowrap'>
                    {comment?.user?.fullName}
                  </span>

                  <span className='text-gray-500 truncate  max-w-24 md:max-w-52'>
                    @{comment?.user?.username}
                  </span>

                  <span className='text-gray-500 text-nowrap'>·</span>

                  <span className='text-gray-500 text-nowrap'>
                    {formatPostDate(comment?.createdAt)}
                  </span>
                </div>
              </div>

              <div className='text-base'>@{authUser.username}</div>

              <div className='mt-2 text-gray-500'>
                Replying to
                <span className='text-sky-600'>@{comment?.user?.username}</span>
              </div>
            </div>
          </div>
        </div>

        <form
          className='flex flex-row gap-2 mt-1 items-center dark:bg-[#15202B] justify-between '
          onSubmit={(e) => handleReplyComment(e, comment?._id)}>
          <div className='flex flex-col w-full'>
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
        </form>
      </div>
      <form method='dialog' className='modal-backdrop'>
        <button className='outline-none'>close</button>
      </form>
    </dialog>
  );
};

export default ReplyCommentModal;
