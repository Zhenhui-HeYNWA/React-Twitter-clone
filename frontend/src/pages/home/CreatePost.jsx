import { useState } from 'react';

import { IoCloseSharp } from 'react-icons/io5';
import { CiLocationOn } from 'react-icons/ci';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { Mention } from 'primereact/mention';
import './CreatePost.css';
import { useTheme } from '../../components/context/ThemeProvider';
import { fetchLocation } from '../../utils/location/location.js';

import CreatePostControls from '../../components/common/PostCommon/CreatePostControls.jsx';

import MentionComponent from '../../components/common/MentionComponent.jsx';

const CreatePost = () => {
  const { theme } = useTheme();
  const [text, setText] = useState('');
  const [imgs, setImgs] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  const [locationName, setLocationName] = useState('');
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  const queryClient = useQueryClient();

  const { data: authUser } = useQuery({
    queryKey: ['authUser'],
  });

  const searchUsers = async (query) => {
    const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) {
      throw new Error('Error fetching search results');
    }
    return res.json();
  };

  const onSearch = async (event) => {
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

  const handleChange = (e) => {
    const value = e.target.value;

    setText(value);

    const lastAt = value.lastIndexOf('@');
    if (lastAt !== -1 && value[lastAt + 1] !== ' ') {
      const query = value.substring(lastAt + 1);
      onSearch({ query });
    }
  };

  const CreatePostItemTemplate = (user) => (
    <div className='card rounded-none z-0 bg-gray-100 dark:bg-[#15202B] w-fit h-18 flex ring-1 ring-white'>
      <div className='card-body p-0'>
        <div
          className='flex gap-2 items-center hover:bg-slate-400 dark:hover:bg-cyan-900 p-2'
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

  const {
    mutate: createPost,
    isPending,
    isError,
    error,
  } = useMutation({
    mutationFn: async ({ text, imgs, locationName }) => {
      const res = await fetch('/api/posts/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, imgs, locationName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      return data;
    },
    onSuccess: () => {
      setText('');
      setImgs([]);
      setLocationName('');
      toast.success('Post created successfully');
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createPost({ text, imgs, locationName });
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
    setText((prevText) => prevText + emoji.native);
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
    <div className='    flex px-4 py-4 items-start gap-4 border-b border-gray-200 dark:border-gray-700 w-full h-fit '>
      <div className='avatar'>
        <div className='w-8 rounded-full'>
          <img
            src={authUser?.profileImg || '/avatar-placeholder.png'}
            alt='Profile'
          />
        </div>
      </div>
      <form
        className=' create-post-container flex flex-col gap-2 w-full h-full  '
        onSubmit={handleSubmit}>
        {/* TODO fix the mention autoResize prop */}
        {/* <Mention
          value={text}
          onChange={handleChange}
          suggestions={suggestions}
          onSearch={onSearch}
          field='username'
          placeholder='What is happening?!'
          itemTemplate={CreatePostItemTemplate}
          className='word-wrap '
          autoResize={true}
        /> */}
        {/* <CustomMention
          // Enable auto resize functionality
          value={text} // Pass the state value
          onChange={handleChange} // Pass the change handler
          suggestions={suggestions} // Pass suggestions if any
          onSearch={onSearch} // Handle the mention search
          field='username'
          placeholder="What's happening?"
          itemTemplate={CreatePostItemTemplate}
          autoResize={true}
        /> */}

        <MentionComponent
          value={text} // Pass the state value
          onChange={handleChange} // Pass the change handler
          suggestions={suggestions} // Pass suggestions if any
          onSearch={onSearch} // Handle the mention search
          field='username'
          placeholder="What's happening?"
        />
        {imgs.length > 0 && (
          <div className='w-full overflow-x-auto '>
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
          </div>
        )}
        {locationName && (
          <div className='flex  items-center gap-1'>
            {' '}
            <CiLocationOn className='fill-primary w-5 h-5' />
            From: {locationName}
          </div>
        )}
        {/* <div className='relative flex justify-between border-t py-2 border-t-gray-700'>
          <div className='flex gap-1 items-center'>
            <CiImageOn
              className='fill-primary w-6 h-6 cursor-pointer'
              onClick={() => imgRef.current.click()}
            />
            <BsEmojiSmileFill
              className='fill-primary w-5 h-5 cursor-pointer'
              onClick={() => setShowEmojiPicker((prev) => !prev)}
            />
            {showEmojiPicker && (
              <div className='absolute top-10 right-5 md:top-10 md:left-10 z-10'>
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
          <button className='btn btn-primary rounded-full btn-sm text-white px-4'>
            {isPending ? 'Posting...' : 'Post'}
          </button>
        </div> */}

        <CreatePostControls
          onImgsChange={handleImgChange}
          onEmojiSelect={handleEmojiSelect}
          onLocationFetch={handleLocation}
          isFetchingLocation={isFetchingLocation} // Replace with actual state
          isPosting={isPending} // Replace with actual state
          onSubmit={handleSubmit}
          theme={theme}
          type={'post'}
        />
        {isError && (
          <div className='text-red-500'>
            {error.message || 'Something went wrong'}
          </div>
        )}
      </form>
    </div>
  );
};

export default CreatePost;
