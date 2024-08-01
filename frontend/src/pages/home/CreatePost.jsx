import { useState, useRef } from 'react';
import { CiImageOn } from 'react-icons/ci';
import { BsEmojiSmileFill } from 'react-icons/bs';
import { IoCloseSharp } from 'react-icons/io5';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import { Mention } from 'primereact/mention';
import './CreatePost.css';
import { useTheme } from '../../components/context/ThemeProvider';

const CreatePost = () => {
  const { theme } = useTheme();
  const [text, setText] = useState('');
  const [img, setImg] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const imgRef = useRef(null);

  const queryClient = useQueryClient();

  const { data: authUser } = useQuery({
    queryKey: ['authUser'],
  });

  // Your existing searchUsers function
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

  const itemTemplate = (user) => {
    return (
      <div className='card rounded-none z-0 bg-gray-100 dark:bg-[#15202B] w-60  h-18 flex ring-1 ring-white'>
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
            <div className='flex flex-col'>
              <span className='font-semibold tracking-tight truncate w-28'>
                {user.fullName}
              </span>
              <span className='text-sm text-slate-500'>@{user.username}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const {
    mutate: createPost,
    isPending,
    isError,
    error,
  } = useMutation({
    mutationFn: async ({ text, img }) => {
      const res = await fetch('/api/posts/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, img }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      return data;
    },
    onSuccess: () => {
      setText('');
      setImg(null);
      toast.success('Post created successfully');
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createPost({ text, img });
  };

  const handleImgChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImg(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEmojiSelect = (emoji) => {
    setText((prevText) => prevText + emoji.native);
  };

  return (
    <div className='  flex p-4 items-start gap-4 border-b border-gray-200 dark:border-gray-700'>
      <div className='avatar'>
        <div className='w-8 rounded-full'>
          <img
            src={authUser?.profileImg || '/avatar-placeholder.png'}
            alt='Profile'
          />
        </div>
      </div>
      <form className=' flex flex-col gap-2 w-full' onSubmit={handleSubmit}>
        <Mention
          value={text}
          onChange={handleChange}
          suggestions={suggestions}
          onSearch={onSearch}
          field='username'
          placeholder='What is happening?!'
          itemTemplate={itemTemplate}
          autoResize
        />
        {img && (
          <div className='relative w-72 mx-auto'>
            <IoCloseSharp
              className='absolute top-0 right-0 text-white bg-gray-800 rounded-full w-5 h-5 cursor-pointer'
              onClick={() => {
                setImg(null);
              }}
            />
            <img
              src={img}
              className='w-full mx-auto h-72 object-contain rounded'
              alt='Preview'
            />
          </div>
        )}
        <div className=' relative flex justify-between border-t py-2 border-t-gray-700'>
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
              <div className='absolute top-10 right-5 z-10'>
                <Picker
                  data={data}
                  onEmojiSelect={handleEmojiSelect}
                  className='bg-slate-100 dark:bg-current'
                  theme={theme === 'dark' ? 'dark' : 'light'}
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
          />
          <button className='btn btn-primary rounded-full btn-sm text-white px-4'>
            {isPending ? 'Posting...' : 'Post'}
          </button>
        </div>
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
