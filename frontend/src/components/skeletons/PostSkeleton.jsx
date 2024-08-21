const PostSkeleton = () => {
  return (
    <div className='flex flex-col gap-4 w-full p-4'>
      <div className='flex gap-4 items-center'>
        <div className='skeleton w-12 h-12 rounded-full shrink-0 bg-gray-400 dark:bg-gray-700'></div>
        <div className='flex flex-col gap-2'>
          <div className='skeleton h-2 w-20 rounded-full bg-gray-400 dark:bg-gray-700'></div>
          <div className='skeleton h-2 w-24 rounded-full bg-gray-400 dark:bg-gray-700'></div>
        </div>
      </div>
      <div className='skeleton h-40 w-full bg-gray-400 dark:bg-gray-700'></div>
    </div>
  );
};

export default PostSkeleton;
