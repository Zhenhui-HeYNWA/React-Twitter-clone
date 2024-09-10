import { Mention } from 'primereact/mention';
import { useState } from 'react';

import RenderImg from './RenderImg/RenderImg';
import toast from 'react-hot-toast';

import { IoCloseSharp } from 'react-icons/io5';
import { CiLocationOn } from 'react-icons/ci';
import { useTheme } from '../../components/context/ThemeProvider';

import { fetchLocation } from '../../utils/location/location.js';

import usePostMutations from '../../hooks/usePostMutations.jsx';
import { formatPostDate } from '../../utils/date/index.js';
import { Link } from 'react-router-dom';
import CreatePostControls from './PostCommon/CreatePostControls.jsx';

const QuotePostModal = ({ authUser, post }) => {
  const { theme } = useTheme();
  const [quote, setQuote] = useState('');
  const [imgs, setImgs] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [locationName, setLocationName] = useState('');

  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const postId = post?._id;
  const formattedDate = formatPostDate(post?.createdAt);
  const isReposted = post?.repost.repostNum > 0;

  const isQuote = !!(
    post?.quote &&
    post?.quote.originalPost &&
    post?.quote.originalUser
  );

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
    <div className='card border-x rounded-none z-40 bg-gray-100 dark:bg-[#15202B] w-full  h-16 flex ring-1 ring-white '>
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

  const renderModalContent = (post, isReposted, isQuote) => {
    let content;

    switch (true) {
      case isReposted:
        content = (
          <>
            <div className='p-2'>{post?.repost.originalText}</div>
            {post?.repost?.originalImgs?.length > 0 && (
              <div className='w-full  overflow-hidden'>
                <RenderImg
                  imgs={post?.repost?.originalImgs}
                  size={post?.repost?.originalImgs.length > 0 ? 'sm' : 'lg'}
                />
              </div>
            )}
          </>
        );
        break;

      case isQuote:
        content = (
          <>
            <div className='p-2'>
              {post?.text} <span> </span>
              <Link
                to={`/${post?.user?.username}/status/${post?._id}`}
                className=' text-blue-600 cursor-pointer underline'>
                {post?.user?.username}/status/{post?._id}
              </Link>
            </div>
            {post?.imgs.length > 0 && (
              <div className=' w-full  overflow-hidden '>
                <RenderImg
                  imgs={post?.imgs}
                  size={imgs.length > 0 ? 'sm' : 'lg'}
                />
              </div>
            )}
          </>
        );
        break;
      default:
        content = (
          <>
            <div
              className='px-2 w-full 
 text-ellipsis'>
              <p className='w-full text-pretty'>{post?.text}</p>
            </div>
            {post?.imgs?.length > 0 && (
              <div className='w-full  overflow-hidden'>
                <RenderImg
                  imgs={post?.imgs}
                  size={imgs.length > 0 ? 'sm' : 'lg'}
                />
              </div>
            )}
          </>
        );
        break;
    }
    return content;
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
      className='modal modal-middle mt-2 dialog-container   '>
      <div className='modal-box  bg-slate-100 dark:bg-[#15202B] py-0 h-fit '>
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
              <div className='quote-post-container pt-4  h-full   '>
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
              <div className='w-full  border  border-gray-300 dark:border-gray-700 h-fit   mt-2 rounded-xl  flex flex-col overflow-hidden '>
                <div className='flex items-center gap-2 w-full   p-2'>
                  <div className='avatar w-8    rounded-full'>
                    <img
                      src={post?.user.profileImg}
                      className='w-7 h-7 rounded-full'
                    />
                  </div>

                  <div className='flex  w-full gap-1 '>
                    <span className='font-bold  text-ellipsis    text-nowrap overflow-hidden w-fit max-w-28 sm:max-w-fit flex-1 '>
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

                <div className=''>
                  {renderModalContent(post, isReposted, isQuote)}
                </div>
              </div>
              <CreatePostControls
                onImgsChange={handleImgChange}
                onEmojiSelect={handleEmojiSelect}
                onLocationFetch={handleLocation}
                isFetchingLocation={isFetchingLocation} // Replace with actual state
                isPosting={isQuoting} // Replace with actual state
                onSubmit={handleSubmit}
                theme={theme}
                type={'quote'}
              />
            </div>
          </div>
        </div>
      </div>
    </dialog>
  );
};

export default QuotePostModal;
