import { Link } from 'react-router-dom';
import { MdHomeFilled } from 'react-icons/md';
import { IoNotifications } from 'react-icons/io5';
import { MdPerson } from 'react-icons/md';
import ThemeToggler from '../context/ThemeToggler';

const MobileBar = ({ authUser }) => {
  return (
    <div className='md:hidden fixed bottom-0 left-0 w-full bg-gray-100 dark:bg-secondary border-t border-gray-200 dark:border-gray-700'>
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
      </div>
    </div>
  );
};

export default MobileBar;
