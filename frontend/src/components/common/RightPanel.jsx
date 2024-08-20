import { useQuery } from '@tanstack/react-query';
import useFollow from '../../hooks/useFollow';

import { Link } from 'react-router-dom';

import LoadingSpinner from './LoadingSpinner';
import RightPanelSkeleton from '../skeletons/RightPanelSkeleton';
import SearchUser from '../../pages/auth/searchUser/SearchUser';

const RightPanel = () => {
  const { data: authUser } = useQuery({
    queryKey: ['authUser'],
  });
  const { data: suggestedUsers, isLoading } = useQuery({
    queryKey: ['suggestedUsers'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/users/suggested');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Something went wrong!');

        return data;
      } catch (error) {
        throw new Error(error.message);
      }
    },
  });

  const { follow, isPending } = useFollow();

  if (suggestedUsers?.length === 0) return <div className='md:w-64 w-0'></div>;

  return (
    <div className=' hidden lg:block my-4 mx-2 '>
      {/* <div className='dropdown items-center justify-center sticky top-0 z-10 '>
        {' '}
        <SearchUser className='w-4 h-4' authUser={authUser} />
      </div> */}
      <div className='dark:bg-[#15202B] p-4 rounded-md sticky top-2'>
        <p className='font-bold'>Who to follow</p>
        <div className='flex flex-col gap-4'>
          {/* item */}
          {isLoading && (
            <>
              <RightPanelSkeleton />
              <RightPanelSkeleton />
              <RightPanelSkeleton />
              <RightPanelSkeleton />
            </>
          )}
          {!isLoading &&
            suggestedUsers?.map((user) => (
              <Link
                to={`/profile/${user.username}`}
                className='flex items-center justify-between gap-4'
                key={user._id}>
                <div className='flex gap-2 items-center'>
                  <div className='avatar'>
                    <div className='w-8 rounded-full'>
                      <img src={user.profileImg || '/avatar-placeholder.png'} />
                    </div>
                  </div>
                  <div className='flex flex-col'>
                    <span className='font-semibold tracking-tight truncate w-28'>
                      {user.fullName}
                    </span>
                    <span className='text-sm text-slate-500'>
                      @{user.username}
                    </span>
                  </div>
                </div>
                <div>
                  <button
                    className='btn bg-white text-black hover:bg-white hover:opacity-90 rounded-full btn-sm'
                    onClick={(e) => {
                      e.preventDefault();
                      follow(user._id);
                    }}>
                    {isPending ? <LoadingSpinner size='sm' /> : 'Follow'}
                  </button>
                </div>
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
};
export default RightPanel;
