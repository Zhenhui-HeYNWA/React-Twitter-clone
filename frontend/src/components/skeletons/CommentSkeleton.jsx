const CommentSkeleton = () => {
  return (
    <div className='flex flex-col gap-4 w-full p-2'>
      <div className='flex flex-row gap-4 items-center'>
        <div className='skeleton w-10 h-10 rounded-full shrink-0 bg-gray-400 dark:bg-gray-700'></div>

        <div className='skeleton h-2 w-12 rounded-full bg-gray-400 dark:bg-gray-700'></div>
        <div className='skeleton h-2 w-16 rounded-full bg-gray-400 dark:bg-gray-700'></div>
        <div className='skeleton h-2 w-12 rounded-full bg-gray-400 dark:bg-gray-700'></div>
      </div>
      <div className='skeleton h-20 w-full bg-gray-400 dark:bg-gray-700'></div>
    </div>
  );
};

export default CommentSkeleton;
