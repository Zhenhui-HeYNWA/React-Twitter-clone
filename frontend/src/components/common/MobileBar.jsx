import { Link } from 'react-router-dom';
import { MdHomeFilled } from 'react-icons/md';
import { IoNotifications } from 'react-icons/io5';
import { MdPerson } from 'react-icons/md';
import ThemeToggler from '../context/ThemeToggler';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { BiLogOut } from 'react-icons/bi';
import { useEffect, useState } from 'react';

const MobileBar = () => {
  const queryClient = useQueryClient();
  const [hasUnread, setHasUnread] = useState(false);

  const { mutate: logout } = useMutation({
    mutationFn: async () => {
      try {
        const res = await fetch('/api/auth/logout', {
          method: 'POST',
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.error || 'Something went wrong');
      } catch (error) {
        throw new Error(error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authUser'] });
    },
    onError: () => {
      toast.error('Logout failed');
    },
  });
  const { data, isSuccess, isError } = useQuery({
    queryKey: ['unreadNotifications'],
    queryFn: async () => {
      const res = await fetch('/api/notifications/unread');
      if (!res.ok) {
        throw new Error('Failed to fetch unread notifications');
      }
      return res.json();
    },
    refetchInterval: 60000,
  });
  useEffect(() => {
    if (isSuccess) {
      setHasUnread(data?.unreadCount > 0);
    }

    if (isError) {
      console.error('Failed to fetch unread notifications');
      setHasUnread(false);
    }
  }, [data, isSuccess, isError]);

  const { data: authUser } = useQuery({ queryKey: ['authUser'] });
  return (
    <div className='md:hidden  fixed bottom-0 left-0 w-full bg-gray-100 dark:bg-[#15202B] border-t border-gray-200 dark:border-gray-700'>
      <div className='flex justify-around items-center p-2'>
        <Link
          to='/'
          className='flex gap-2 items-center text-gray-800 dark:text-white'>
          <MdHomeFilled className='w-6 h-6' />
        </Link>
        <Link
          to='/notifications'
          className=' relative flex gap-2 items-center text-gray-800 dark:text-white'
          onClick={() => setHasUnread(false)}>
          <IoNotifications className='w-5 h-5' />
          {hasUnread && (
            <span className='bg-sky-600 rounded-full h-2 w-2 absolute top-0 left-3'></span>
          )}
        </Link>
        <Link
          to={`/profile/${authUser?.username}`}
          className='flex gap-2 items-center text-gray-800 dark:text-white'>
          <MdPerson className='w-6 h-6' />
        </Link>
        <ThemeToggler />
        {authUser && (
          <>
            <BiLogOut
              className='w-5 h-5 cursor-pointer text-gray-800 dark:text-white'
              onClick={(e) => {
                e.preventDefault();
                logout();
              }}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default MobileBar;
