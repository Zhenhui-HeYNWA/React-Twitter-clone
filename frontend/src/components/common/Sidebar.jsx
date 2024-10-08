import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import XSvg from '../svgs/X';
import { MdHomeFilled } from 'react-icons/md';
import { IoNotifications } from 'react-icons/io5';
import { FaUser } from 'react-icons/fa';
import { BiLogOut } from 'react-icons/bi';

import { Link } from 'react-router-dom';
import ThemeToggler from '../context/ThemeToggler';
import { useEffect, useState } from 'react';

const Sidebar = () => {
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
    <div className='md:flex-[2-2-0] w-18 max-w-52'>
      <div className='sticky top-0 left-0 h-screen flex flex-col border-r border-gray-200 dark:border-gray-700 w-20 md:w-full'>
        <Link to='/ ' className='flex justify-center md:justify-start'>
          <XSvg className='px-2 w-12 h-12 rounded-full dark:fill-white hover:bg-slate-100 dark:hover:bg-[#303134]' />
        </Link>
        <ul className='flex flex-col gap-3 mt-4'>
          <li className='flex justify-center md:justify-start'>
            <Link
              to='/'
              className='flex gap-3 items-center hover:bg-slate-100 dark:hover:bg-[#303134] transition-all rounded-full duration-300 py-2 pl-2 pr-4 max-w-fit cursor-pointer'>
              <MdHomeFilled className='w-6 h-6 text-secondary dark:text-white' />
              <span className='text-lg hidden md:block text-gray-800 dark:text-white'>
                Home
              </span>
            </Link>
          </li>

          <li
            className='flex justify-center md:justify-start'
            onClick={() => setHasUnread(false)}>
            <Link
              to='/notifications'
              className=' relative flex gap-3 items-center hover:bg-slate-100 dark:hover:bg-[#303134] transition-all rounded-full duration-300 py-2 pl-2 pr-4 max-w-fit cursor-pointer'>
              <IoNotifications className='w-6 h-6 text-secondary dark:text-white' />
              {hasUnread && (
                <span className='bg-sky-600 rounded-full h-2 w-2 absolute top-2 left-6'></span>
              )}
              <span className='text-lg hidden md:block text-gray-800 dark:text-white'>
                Notifications
              </span>
            </Link>
          </li>

          <li className='flex justify-center md:justify-start'>
            <Link
              to={`/profile/${authUser?.username}`}
              className='flex gap-3 items-center hover:bg-slate-100 dark:hover:bg-[#303134] transition-all rounded-full duration-300 py-2 pl-2 pr-4 max-w-fit cursor-pointer'>
              <FaUser className='w-6 h-6 text-secondary dark:text-white' />
              <span className='text-lg hidden md:block text-gray-800 dark:text-white'>
                Profile
              </span>
            </Link>
          </li>
          <li className='flex justify-center items-center  md:justify-start md:p-2'>
            <ThemeToggler />
          </li>
        </ul>

        {authUser && (
          <Link
            to={`/profile/${authUser.username}`}
            className='mt-auto mb-10 flex gap-2 items-start transition-all duration-300   py-2 px-4 rounded-full'>
            <div className='avatar hidden md:inline-flex'>
              <div className='w-8 rounded-full'>
                <img src={authUser?.profileImg || '/avatar-placeholder.png'} />
              </div>
            </div>

            <div className='flex justify-between flex-1'>
              <div className='hidden md:block'>
                <p className='font-bold text-sm text-gray-800 dark:text-white w-20 truncate'>
                  {authUser?.fullName}
                </p>
                <p className='text-gray-500 dark:text-gray-400 text-sm'>
                  @{authUser?.username}
                </p>
              </div>
              <BiLogOut
                className='w-5 h-5 cursor-pointer text-gray-800 dark:text-white'
                onClick={(e) => {
                  e.preventDefault();
                  logout();
                }}
              />
            </div>
          </Link>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
