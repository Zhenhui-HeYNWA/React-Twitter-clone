import { useRef, useState } from 'react';
import { BsEmojiSmileFill } from 'react-icons/bs';
import { CiImageOn, CiLocationOn } from 'react-icons/ci';
import Picker from '@emoji-mart/react';

import data from '@emoji-mart/data';
import LoadingSpinner from '../LoadingSpinner';
import './CreatePostControls.css';

const CreatePostControls = ({
  onImgsChange,
  onEmojiSelect,
  onLocationFetch,
  isFetchingLocation,
  isPosting,
  onSubmit,
  theme,
  type,
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const imgRef = useRef(null);

  return (
    <div className='flex justify-between border-t py-2   border-gray-200  dark:border-slate-700    bottom-0 bg-slate-100 dark:bg-[#15202B]  w-full relative '>
      <div className='flex gap-1 items-center  relative  '>
        <CiImageOn
          className='fill-primary w-6 h-6 cursor-pointer'
          onClick={() => imgRef.current.click()}
        />

        <BsEmojiSmileFill
          className='fill-primary w-5 h-5 cursor-pointer '
          onClick={() => setShowEmojiPicker((prev) => !prev)}
        />

        {showEmojiPicker && (
          <div
            className={`${
              type === 'post'
                ? ' absolute top-10  -left-10 md:top-10 md:left-10 z-50'
                : ' absolute top-8 -left-16  '
            }`}>
            <Picker
              className={`${
                type === 'post'
                  ? ' absolute top-10  right-2 md:top-10 md:left-10 z-50'
                  : ' absolute top-10  sm:bottom-5 md:left-0 z-50 '
              }`}
              data={data}
              onEmojiSelect={onEmojiSelect}
              theme={theme === 'dark' ? 'dark' : 'light'}
              previewPosition={'none'}
            />
          </div>
        )}

        {type === 'Reply' ? (
          ''
        ) : !isFetchingLocation ? (
          <CiLocationOn
            className='fill-primary w-5 h-5 cursor-pointer'
            onClick={onLocationFetch}
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
        onChange={onImgsChange}
        multiple
      />
      <button
        onClick={onSubmit}
        className={`btn btn-primary rounded-full btn-sm text-white px-4 ${
          isPosting ? 'disabled' : ''
        }`}>
        {isPosting ? (
          <>
            <LoadingSpinner size='sm' /> {type === 'post' && 'Posting'}
            {type === 'quote' && 'Quoting'}
            {type === 'Reply' && 'Replying'}
          </>
        ) : (
          <>
            {type === 'quote' && 'Quote'}
            {type === 'post' && 'Post'}
            {type === 'Reply' && 'Reply'}
          </>
        )}
      </button>
    </div>
  );
};

export default CreatePostControls;
