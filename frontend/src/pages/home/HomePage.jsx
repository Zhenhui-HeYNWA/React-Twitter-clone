import { useState } from 'react';

import CreatePost from './CreatePost';

import Posts from '../../components/common/Posts';
import { useQuery } from '@tanstack/react-query';

const HomePage = () => {
  const { data: authUser } = useQuery({
    queryKey: ['authUser'],
  });
  const [feedType, setFeedType] = useState('forYou');
  return (
    <div className='flex-[4_4_0] border-r  border-gray-200 dark:border-gray-700 min-h-screen'>
      {/*Header*/}
      <div className='flex w-full border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 bg-gray-200 dark:bg-[#15202b]'>
        <div
          className={
            'flex justify-center flex-1 p-3 hover:bg-slate-100 dark:hover:bg-[#15202B] transition duration-300 cursor-pointer relative'
          }
          onClick={() => setFeedType('forYou')}>
          For you
          {feedType === 'forYou' && (
            <div className='absolute bottom-0 w-10 h-1 rounded-full bg-primary'>
              {' '}
            </div>
          )}
        </div>

        <div
          className='flex justify-center flex-1 p-3 hover:bg-slate-100 dark:hover:bg-[#15202B] transition duration-300 cursor-pointer relative'
          onClick={() => setFeedType('following')}>
          Following
          {feedType === 'following' && (
            <div className='absolute bottom-0 w-10 h-1 rounded-full bg-primary'></div>
          )}
        </div>
      </div>

      {/*Create post input */}
      <CreatePost />

      {/* Posts */}
      <Posts feedType={feedType} username={authUser.username} />
    </div>
  );
};

export default HomePage;
