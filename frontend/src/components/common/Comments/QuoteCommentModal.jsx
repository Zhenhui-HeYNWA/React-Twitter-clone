import { useState } from 'react';
import CustomMention from '../MentionComponent';
import { IoCloseSharp } from 'react-icons/io5';
import { CiLocationOn } from 'react-icons/ci';

import { formatPostDate } from '../../../utils/date';
import CreatePostControls from '../PostCommon/CreatePostControls';
import RenderText from '../PostCommon/RenderText';
import './QuoteCommentModal.css';
import toast from 'react-hot-toast';
import { fetchLocation } from '../../../utils/location/location';
import useCommentMutations from '../../../hooks/useCommentMutations';
const QuoteCommentModal = ({ authUser, comment }) => {
  const [quote, setQuote] = useState('');
  const [locationName, setLocationName] = useState('');
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [imgs, setImgs] = useState([]);
  const formattedDate = formatPostDate(comment?.createdAt);
  const { quoteComment, isQuoting, isError, error } = useCommentMutations(
    comment._id
  );

  const handleEmojiSelect = (emoji) => {
    setQuote((prevText) => prevText + emoji.native);
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

  const handleLocation = async () => {
    if (navigator.geolocation) {
      setIsFetchingLocation(true); // Start loading
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const locationData = await fetchLocation(latitude, longitude);
            setLocationName(locationData.address.city);
          } catch (error) {
            console.error('Failed to retrieve location data:', error);
          } finally {
            setIsFetchingLocation(false); // Stop loading
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          setIsFetchingLocation(false); // Stop loading
        }
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    quoteComment({
      text: quote,
      imgs,
      locationName,
      onModel: 'Comment',
      commentId: comment._id,
    });

    setQuote('');
    setImgs([]);
    setLocationName('');
  };
  return (
    <dialog
      id={`QuoteModel${comment?._id}`}
      className='modal modal-middle mt-2 dialog-container   '>
      <div className='modal-box  bg-slate-100 dark:bg-[#15202B] py-0 h-fit overflow-visible '>
        <div className=' w-full h-10 sticky top-0 z-50 bg-slate-100 dark:bg-[#15202B]'>
          <form method='dialog' className=' z-auto'>
            {/* Close button */}
            <button
              type='btn'
              className='btn-sm btn-circle btn-ghost absolute left-2 top-2'>
              ✕
            </button>
          </form>
        </div>

        {/* Modal content */}
        <div className='flex  flex-row pt-4 gap-2 w-full  items-center relative  '>
          <div className=' absolute top-6 left-0'>
            <div className='avatar w-10 h-10 rounded-full '>
              <img
                src={authUser?.profileImg}
                className='w-10 h-10 rounded-full'
                alt='Profile'
              />
            </div>
          </div>
          <div className='flex flex-col w-full h-full max-h-128 '>
            <div className='flex flex-col gap-1 w-full h-full pl-12  '>
              <div className=' quote-post-container pt-4  h-full   '>
                <CustomMention
                  value={quote}
                  placeholderText='Post your quote'
                  onChange={(e) => setQuote(e.target.value)}
                />
              </div>
              {imgs.length > 0 && (
                <div className='w-full overflow-x-auto '>
                  <div className='flex gap-2'>
                    {imgs.map((img, index) => (
                      <div
                        key={img}
                        className='relative flex-shrink-0'
                        style={{
                          flex: imgs.length > 1 ? '0 0 10rem' : '0 0 auto',
                        }}>
                        <IoCloseSharp
                          className='absolute top-1 right-2 text-white bg-gray-800 rounded-full w-5 h-5 cursor-pointer'
                          onClick={() => {
                            setImgs(imgs.filter((_, i) => i !== index));
                          }}
                        />
                        <img
                          src={img}
                          className={'w-36 h-44 object-cover rounded-2xl'}
                          alt={`Preview ${index + 1}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {locationName && (
                <div className='flex  items-center gap-1'>
                  <CiLocationOn className='fill-primary w-5 h-5' />
                  From: {locationName}
                </div>
              )}
              {isError && (
                <div className='text-red-500'>
                  {error.message || 'Something went wrong'}
                </div>
              )}
              <div className='w-full  border  border-gray-300 dark:border-gray-700 h-fit   mt-2 rounded-xl  flex flex-col overflow-hidden '>
                <div className='flex items-center gap-2 w-full   p-2'>
                  <div className='avatar w-8    rounded-full'>
                    <img
                      src={comment?.user.profileImg}
                      className='w-7 h-7 rounded-full'
                    />
                  </div>

                  <div className='flex  w-full gap-1 '>
                    <span className='font-bold  text-ellipsis    text-nowrap overflow-hidden w-fit max-w-28 sm:max-w-fit flex-1 '>
                      {comment?.user.fullName}
                    </span>
                    <div className=' flex-1 flex '>
                      <span className='text-slate-400  truncate overflow-hidden max-w-12 sm:max-w-52  '>
                        @{comment?.user.username}
                      </span>
                      <div className='flex-1 gap-2 flex'>
                        <span className='text-slate-400 text-nowrap'>·</span>
                        <span className='text-slate-400  text-nowrap'>
                          {formattedDate}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* <div className=''>
                  {renderModalContent(post, isReposted, isQuote)}
                </div> */}
                <div className='p-2'>
                  <RenderText text={comment.text} />
                </div>
              </div>
              <CreatePostControls
                onImgsChange={handleImgChange}
                onEmojiSelect={handleEmojiSelect}
                onLocationFetch={handleLocation}
                isFetchingLocation={isFetchingLocation} // Replace with actual state
                isPosting={isQuoting} // Replace with actual state
                onSubmit={handleSubmit}
                // theme={theme}
                type={'quote'}
              />
            </div>
          </div>
        </div>
      </div>
    </dialog>
  );
};

export default QuoteCommentModal;
