const FollowingSkeleton = () => {
  return (
    <div className='border-gray-700 p-2 '>
      <div className=' flex items-center justify-between gap-4'>
        <div className='flex gap-2 items-center'>
          <div className='avatar'>
            <div className='skeleton w-8 h-8 rounded-full bg-gray-400 dark:bg-gray-700'></div>
          </div>
          <div className='flex flex-col'>
            <div className='skeleton h-4 w-28 rounded bg-gray-400 dark:bg-gray-700'></div>
            <div className='skeleton h-3 w-20 mt-1 rounded bg-gray-400 dark:bg-gray-700'></div>
            <div className='skeleton h-4 w-50 mt-1 rounded bg-gray-400 dark:bg-gray-700'></div>
          </div>
        </div>
        <div>
          <div className='skeleton h-8 w-24 rounded-full bg-gray-400 dark:bg-gray-700'></div>
        </div>
      </div>
    </div>
  );
};

export default FollowingSkeleton;
