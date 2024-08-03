import { Link } from 'react-router-dom';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

import LoadingSpinner from '../../components/common/LoadingSpinner';

import { IoTrashBin } from 'react-icons/io5';
import { FaUser, FaHeart } from 'react-icons/fa';
import { VscMention } from 'react-icons/vsc';

const NotificationPage = ({ authUser }) => {
  const queryClient = useQueryClient();
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/notifications');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Something went wrong');

        return data;
      } catch (error) {
        throw new Error(error);
      }
    },
  });
  const { mutate: deleteNotifications } = useMutation({
    mutationFn: async () => {
      try {
        const res = await fetch('/api/notifications', {
          method: 'DELETE',
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || 'Something went wrong');
        return data;
      } catch (error) {
        throw new Error(error);
      }
    },
    onSuccess: () => {
      toast.success('Notifications deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <>
      <div className='flex-[4_4_0] border-l border-r  border-gray-200 dark:border-gray-700 min-h-screen'>
        <div className='flex justify-between items-center p-4 border-b  border-gray-200 dark:border-gray-700'>
          <div className='avatar'>
            <div className='w-8 rounded-full'>
              <img src={authUser.profileImg || '/avatar-placeholder.png'} />
            </div>
          </div>
          <p className='font-bold'>Notifications</p>
          <div className='dropdown '>
            <div tabIndex={0} role='button' className='m-1'>
              <IoTrashBin onClick={deleteNotifications} className='w-6 h-6' />
            </div>
          </div>
        </div>
        {isLoading && (
          <div className='flex justify-center h-full items-center'>
            <LoadingSpinner size='lg' />
          </div>
        )}
        {notifications?.length === 0 && (
          <div className='text-center p-4 font-bold'>No notifications 🤔</div>
        )}
        {notifications?.map((notification) => (
          <div
            className='border-b  border-gray-200 dark:border-gray-700'
            key={notification._id}>
            <div className='flex gap-2 p-4'>
              {notification.type === 'follow' && (
                <FaUser className='w-6 h-6 text-primary' />
              )}
              {notification.type === 'likes' && (
                <FaHeart className='w-6 h-6 text-red-500' />
              )}
              {notification.type === 'mention' && (
                <VscMention className='w-7 h-7 text-sky-600' />
              )}
              <Link to={`/profile/${notification.from.username}`}>
                <div className='avatar'>
                  <div className='w-8 rounded-full'>
                    <img
                      src={
                        notification.from.profileImg ||
                        '/avatar-placeholder.png'
                      }
                    />
                  </div>
                </div>
                <div className='flex gap-1'>
                  <span className='font-bold'>
                    @{notification.from.username}
                  </span>{' '}
                  {notification.type === 'follow' && 'followed you'}
                  {notification.type === 'likes' && 'liked your post'}
                  {notification.type === 'mention' && 'mention you'}
                </div>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default NotificationPage;
