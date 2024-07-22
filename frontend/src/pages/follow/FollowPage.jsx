import { Link, useParams } from 'react-router-dom';
import { useState } from 'react';

import { FaArrowLeft } from 'react-icons/fa';

import FollowAndFollowing from '../../components/common/FollowAndFollowing';
import SearchUser from '../auth/searchUser/SearchUser';
import { useQuery } from '@tanstack/react-query';

const FollowPage = () => {
  const [followType, setFollowType] = useState('following');
  const { username } = useParams();
  
  const { data: authUser } = useQuery({
    queryKey: ['authUser'],
  });

  return (
    <div className='flex-[4_4_0] border-r border-gray-200 dark:border-gray-700 min-h-screen'>
      <div className='flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700'>
        <Link to='/'>
          <FaArrowLeft className='w-4 h-4' />
        </Link>
        <p className='font-bold'>{username}</p>
        <div className='dropdown items-center justify-center '>
          {' '}
          <SearchUser className='w-4 h-4' authUser={authUser} />
        </div>
      </div>
      <div className='flex w-full border-b border-gray-200 dark:border-gray-700 pt-3 items-center '>
        <div
          className='flex justify-center flex-1 p-3 hover:bg-slate-100 dark:hover:bg-secondary transition duration-300 relative cursor-pointer'
          onClick={() => setFollowType('following')}>
          Following
          {followType === 'following' && (
            <div className='absolute bottom-0 w-10 h-1 rounded-full bg-primary' />
          )}
        </div>
        <div
          className={`flex justify-center flex-1 p-3 hover:bg-slate-100 dark:hover:bg-secondary transition duration-300 relative cursor-pointer ${
            followType === 'follow' ? 'text-slate-500' : ''
          }`}
          onClick={() => setFollowType('followers')}>
          Followers
          {followType === 'followers' && (
            <div className='absolute bottom-0 w-10  h-1 rounded-full bg-primary' />
          )}
        </div>
      </div>
      <FollowAndFollowing feedType={followType} username={username} />
    </div>
  );
};

export default FollowPage;
