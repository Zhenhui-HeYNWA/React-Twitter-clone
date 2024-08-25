import { BsThreeDots } from 'react-icons/bs';

import { FaTrash } from 'react-icons/fa';
import { MdOutlinePushPin } from 'react-icons/md';

import { SlUserFollow, SlUserUnfollow } from 'react-icons/sl';
import useFollow from '../../../hooks/useFollow';

const ListFunction = ({
  postId,
  isMyPost,
  postUser,
  authUser,
  isOriginalPost,
  onPostDeleteClick,
}) => {
  const isFollowing = authUser?.followings.includes(postUser?._id);
  const { follow } = useFollow();

  return (
    <div className='dropdown dropdown-bottom dropdown-end'>
      <BsThreeDots tabIndex={2} role='button' className='active:fill-sky-600' />
      <ul
        tabIndex={2}
        className='dropdown-content menu bg-slate-100 dark:bg-[#1E2732]  border-gray-200 border rounded-box z-[1] w-max   p-2 shadow'>
        {isMyPost && (
          <>
            <li>
              <span
                className='flex items-center hover:text-red-500 '
                onClick={() => {
                  const elem = document.activeElement;
                  if (elem) {
                    elem?.blur();
                  }

                  onPostDeleteClick(postId);
                }}>
                <FaTrash className='cursor-pointer  ' />

                <a>Delete post</a>
              </span>
            </li>

            {isOriginalPost && (
              <li className='p-0'>
                <span
                  className='flex items-center justify-start'
                  onClick={() => {
                    const elem = document.activeElement;
                    if (elem) {
                      elem?.blur();
                    }
                  }}>
                  <MdOutlinePushPin className='h-4 w-4' />
                  <a>Pin post</a>
                </span>
              </li>
            )}
          </>
        )}
        {!isMyPost && (
          <>
            {!isFollowing && (
              <li className=''>
                <span
                  className=' flex font-bold '
                  onClick={(e) => {
                    e.preventDefault();
                    follow(postUser._id);
                    const elem = document.activeElement;
                    if (elem) {
                      elem?.blur();
                    }
                  }}
                  tabIndex={2}
                  role='button'>
                  <SlUserFollow
                    className='w-4 h-4  font-bold'
                    style={{ strokeWidth: '5' }}
                  />
                  <a>Follow @{postUser?.username}</a>
                </span>
              </li>
            )}
            {isFollowing && (
              <li className=''>
                <span
                  className=' flex font-bold '
                  onClick={(e) => {
                    e.preventDefault();
                    follow(postUser._id);
                    const elem = document.activeElement;
                    if (elem) {
                      elem?.blur();
                    }
                  }}
                  tabIndex={2}
                  role='button'>
                  <SlUserUnfollow
                    className='w-4 h-4  font-bold'
                    style={{ strokeWidth: '5' }}
                  />
                  <a>Unfollow @{postUser?.username}</a>
                </span>
              </li>
            )}
          </>
        )}
      </ul>
    </div>
  );
};

export default ListFunction;
