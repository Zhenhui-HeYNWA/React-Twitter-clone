import { Mention } from 'primereact/mention';
import { useRef, useState } from 'react';
import { BsEmojiSmileFill } from 'react-icons/bs';
import RenderImg from './RenderImg/RenderImg';
import toast from 'react-hot-toast';
import Picker from '@emoji-mart/react';
import { IoCloseSharp } from 'react-icons/io5';
import { CiImageOn, CiLocationOn } from 'react-icons/ci';
import { useTheme } from '../../components/context/ThemeProvider';
import data from '@emoji-mart/data';
import { fetchLocation } from '../../utils/location/location.js';
import LoadingSpinner from './LoadingSpinner';
import usePostMutations from '../../hooks/usePostMutations.jsx';
import { formatPostDate } from '../../utils/date/index.js';
const QuotePostModal = ({ authUser, post }) => {
  const { theme } = useTheme();
  const [quote, setQuote] = useState('');
  const [imgs, setImgs] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [locationName, setLocationName] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const imgRef = useRef(null);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const postId = post?._id;
  const formattedDate = formatPostDate(post?.createdAt);

  const { quotePost, isQuoting, isError, error } = usePostMutations(postId);

  const searchUsers = async (query) => {
    const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) {
      throw new Error('Error fetching search results');
    }
    return res.json();
  };

  const onSearch = async (event) => {
    console.log(123);
    const query = event.query.trim();

    if (query) {
      try {
        const users = await searchUsers(query);
        setSuggestions(users);
      } catch (error) {
        console.error('Failed to fetch search results:', error);
      }
    } else {
      setSuggestions([]); // Clear suggestions if query is empty
    }
  };

  const itemTemplate = (user) => (
    <div className='card border-x rounded-none z-40 bg-gray-100 dark:bg-[#15202B] w-60 h-18 flex ring-1 ring-white '>
      <div className='card-body p-0'>
        <div
          className='flex gap-2 items-center hover:bg-slate-300 dark:hover:bg-cyan-900 p-2'
          key={user._id}>
          <div className='avatar'>
            <div className='w-8 rounded-full'>
              <img
                src={user.profileImg || '/avatar-placeholder.png'}
                alt={`${user.fullName}'s profile`}
              />
            </div>
          </div>
          <div className='flex flex-col  '>
            <span className='font-semibold tracking-tight truncate w-28'>
              {user.fullName}
            </span>
            <span className='text-sm text-slate-500'>@{user.username}</span>
          </div>
        </div>
      </div>
    </div>
  );

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

  const handleChange = (e) => {
    const value = e.target.value;
    setQuote(value);
  };
  const handleEmojiSelect = (emoji) => {
    setQuote((prevText) => prevText + emoji.native);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    quotePost({
      text: quote,
      imgs,
      locationName,
    });

    setQuote('');
    setImgs([]);
    setLocationName('');
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
  return (
    <dialog
      id={`QuoteModel${post?._id}`}
      className='modal modal-middle mt-2 dialog-container  '>
      <div className='modal-box  bg-slate-200 dark:bg-[#15202B] pb-0 px-2   h-max overflow-visible  '>
        <form method='dialog'>
          {/* Close button */}
          <button
            type='btn'
            className='btn-sm btn-circle btn-ghost absolute left-2 top-2'>
            ✕
          </button>
        </form>

        {/* Modal content */}
        <div className='flex  flex-row pt-4 gap-2 w-full items-center relative '>
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
            <div className='flex flex-col gap-2 w-full h-full pl-12  '>
              <div className='quote-post-container pt-4 w-auto h-full   '>
                <Mention
                  value={quote}
                  onChange={handleChange}
                  onSearch={onSearch}
                  suggestions={suggestions}
                  field='username'
                  itemTemplate={itemTemplate}
                  placeholder='Add a comment'
                  className='text-nowrap h-auto '
                  autoResize={true}
                />
              </div>
              {imgs.length > 0 && (
                <div className='w-full overflow-x-auto '>
                  <div className='flex gap-2'>
                    {imgs.map((img, index) => (
                      <div
                        key={index}
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

              <div className='w-full border  border-gray-300 dark:border-gray-700   mt-2 rounded-xl  flex flex-col overflow-hidden'>
                <div className='flex items-center gap-2 w-full p-2'>
                  <div className='avatar w-8   rounded-full'>
                    <img
                      src={post?.user.profileImg}
                      className='w-7 h-7 rounded-full'
                    />
                  </div>

                  <div className='flex  w-full gap-1'>
                    <span className='font-bold  text-ellipsis   text-nowrap overflow-hidden w-fit max-w-28 sm:max-w-fit flex-1 '>
                      {post?.user.fullName}
                    </span>
                    <div className=' flex-1 flex '>
                      <span className='text-slate-400  truncate overflow-hidden max-w-12 sm:max-w-52  '>
                        @{post?.user.username}
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
                <div className='p-2'>{post?.text}</div>
                {post?.imgs.length > 0 && (
                  <RenderImg imgs={post?.imgs} className='' />
                )}
              </div>
              <div className='flex justify-between border-t py-2  border-gray-200  dark:border-slate-700 mt-2 sticky bottom-0 bg-slate-200 dark:bg-[#15202B]  w-full'>
                <div className='flex gap-1 items-center relative'>
                  <CiImageOn
                    className='fill-primary w-6 h-6 cursor-pointer'
                    onClick={() => imgRef.current.click()}
                  />
                  <BsEmojiSmileFill
                    className='fill-primary w-5 h-5 cursor-pointer'
                    onClick={() => setShowEmojiPicker((prev) => !prev)}
                  />
                  {showEmojiPicker && (
                    <div className='absolute bottom-10 right-0 md:bottom-11 md:left-0 z-10'>
                      <Picker
                        data={data}
                        onEmojiSelect={handleEmojiSelect}
                        className='bg-slate-100 dark:bg-current'
                        theme={theme === 'dark' ? 'dark' : 'light'}
                      />
                    </div>
                  )}
                  {!isFetchingLocation ? (
                    <CiLocationOn
                      className='fill-primary w-5 h-5 cursor-pointer'
                      onClick={handleLocation}
                    />
                  ) : (
                    <LoadingSpinner size='sm' />
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
                <button
                  onClick={handleSubmit} // Handle form submission here
                  className={`btn btn-primary rounded-full btn-sm text-white px-4 ${
                    isQuoting ? 'disabled' : ''
                  }`}>
                  {isQuoting ? (
                    <>
                      <LoadingSpinner size='sm' /> Quoting
                    </>
                  ) : (
                    'Quote'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </dialog>
  );
};

export default QuotePostModal;
