import { BsEmojiSmileFill } from 'react-icons/bs';
import { CiImageOn } from 'react-icons/ci';
import LoadingSpinner from '../LoadingSpinner';
import { useRef, useState } from 'react';

import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import { useTheme } from '../../context/ThemeProvider';

const CommentsControls = ({ isSending, onImgsChange, onEmojiSelect }) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const imgRef = useRef(null);
  const { theme } = useTheme();

  return (
    <div className=' justify-between flex bg-yellow-200 w-full'>
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
          <div className='absolute top-6  md:top-6 md:left-10 z-10 '>
            <Picker
              data={data}
              onEmojiSelect={onEmojiSelect}
              theme={theme === 'dark' ? 'dark' : 'light'}
              maxFrequentRows={0}
              perLine={7}
              emojiSize={20}
              searchPosition={'none'}
              previewPosition={'bottom'}
            />
          </div>
        )}
      </div>
      <input
        type='file'
        hidden
        ref={imgRef}
        accept='image/*'
        onChange={onImgsChange}
        multiple
      />
      <button className='btn btn-primary rounded-full btn-sm text-white px-4'>
        {isSending ? (
          <span className='flex items-center gap-1'>
            <LoadingSpinner size='md' />
            Replying
          </span>
        ) : (
          'Reply'
        )}
      </button>
    </div>
  );
};

export default CommentsControls;
