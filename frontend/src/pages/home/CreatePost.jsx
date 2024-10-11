import { useState } from 'react';

import { IoCloseSharp } from 'react-icons/io5';
import { CiLocationOn } from 'react-icons/ci';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Compressor from 'compressorjs';

import './CreatePost.css';
import { useTheme } from '../../components/context/ThemeProvider';
import { fetchLocation } from '../../utils/location/location.js';

import CreatePostControls from '../../components/common/PostCommon/CreatePostControls.jsx';
import CustomMention from '../../components/common/MentionComponent.jsx';

const CreatePost = () => {
  const { theme } = useTheme();
  const [text, setText] = useState('');
  const [imgs, setImgs] = useState([]);

  const [locationName, setLocationName] = useState('');
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  const queryClient = useQueryClient();

  const { data: authUser } = useQuery({
    queryKey: ['authUser'],
  });

  const {
    mutate: createPost,
    isPending,
    isError,
    error,
  } = useMutation({
    mutationFn: async (formData) => {
      const res = await fetch('/api/posts/create', {
        method: 'POST',
        body: formData, // Send FormData
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
    const formData = new FormData();
    formData.append('text', text);
    formData.append('locationName', locationName);
  
    imgs.forEach((img) => {
      formData.append('imgs', img);
    });
  
    createPost(formData);
  };

  // const handleImgChange = (e) => {
  //   const files = e.target.files;
  //   if (files && files.length + imgs.length <= 4) {

  //     const newImgs = [...imgs];
  //     Array.from(files).forEach((file) => {
  //       const reader = new FileReader();
  //       reader.onload = () => {
  //         newImgs.push(reader.result);
  //         if (newImgs.length <= 4) {
  //           setImgs(newImgs);
  //         } else {
  //           toast.error('You can upload up to 4 images.');
  //         }
  //       };
  //       reader.readAsDataURL(file);
  //     });
  //   } else {
  //     toast.error('You can upload up to 4 images.');
  //   }
  // };

  const handleImgChange = (e) => {
    const files = e.target.files;
    if (files && files.length + imgs.length <= 4) {
      const newImgs = [...imgs];
      Array.from(files).forEach((file) => {
        new Compressor(file, {
          quality: 0.6,
          maxWidth: 1024,
          maxHeight: 1024,
          success(compressedResult) {
            const compressedFile = new File([compressedResult], file.name, {
              type: compressedResult.type,
              lastModified: Date.now(),
            });
            newImgs.push(compressedFile);
            if (newImgs.length <= 4) {
              setImgs(newImgs);
            } else {
              toast.error('You can upload up to 4 images.');
            }
          },
          error(err) {
            console.error('Compression error', err);
            toast.error('Image compression failed');
          },
        });
      });
    } else {
      toast.error('You can upload up to 4 images');
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
        className=' create-post-container flex flex-col gap-2 w-full h-full relative '
        onSubmit={handleSubmit}>
        {/* TODO fix the mention autoResize prop */}

        <CustomMention
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholderText='What is happening?!'
        />

        {imgs.length > 0 && (
          <div className='w-full overflow-x-auto '>
            <div className='flex gap-2'>
              {imgs.map((img, index) => (
                <div
                  key={index}
                  className='relative flex-shrink-0'
                  style={{ flex: imgs.length > 1 ? '0 0 10rem' : '0 0 auto' }}>
                  <IoCloseSharp
                    className='absolute top-1 right-2 text-white bg-gray-800 rounded-full w-5 h-5 cursor-pointer'
                    onClick={() => {
                      setImgs(imgs.filter((_, i) => i !== index));
                    }}
                  />
                  <img
                    src={URL.createObjectURL(img)}
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
