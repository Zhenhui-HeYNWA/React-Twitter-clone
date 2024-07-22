import { Link } from 'react-router-dom';
import { MdHomeFilled } from 'react-icons/md';
import { IoNotifications } from 'react-icons/io5';
import { MdPerson } from 'react-icons/md';
import ThemeToggler from '../context/ThemeToggler';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { BiLogOut } from 'react-icons/bi';

const MobileBar = () => {
  const queryClient = useQueryClient();

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

  const { data: authUser } = useQuery({ queryKey: ['authUser'] });
  return (
    <div className='md:hidden  fixed bottom-0 left-0 w-full bg-gray-100 dark:bg-secondary border-t border-gray-200 dark:border-gray-700'>
      <div className='flex justify-around items-center p-2'>
        <Link
          to='/'
          className='flex gap-2 items-center text-gray-800 dark:text-white'>
          <MdHomeFilled className='w-6 h-6' />
        </Link>
        <Link
          to='/notifications'
          className='flex gap-2 items-center text-gray-800 dark:text-white'>
          <IoNotifications className='w-6 h-6' />
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
              className='w-6 h-6 cursor-pointer text-gray-800 dark:text-white'
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
