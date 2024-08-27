import { BsThreeDots } from 'react-icons/bs';

import { FaTrash } from 'react-icons/fa';
import { MdOutlinePushPin } from 'react-icons/md';

import { SlUserFollow, SlUserUnfollow } from 'react-icons/sl';
import useFollow from '../../../hooks/useFollow';
import usePostMutations from '../../../hooks/usePostMutations';

const ListFunction = ({
  id,
  isBelongsToAuthUser,
  owner,
  authUser,
  isOriginal,
  onDeleteClick,
}) => {
  const isFollowing = authUser?.followings.includes(owner?._id);
  const { follow } = useFollow();
  const { pinPost } = usePostMutations(id);

  return (
    <div className='dropdown dropdown-bottom dropdown-end'>
      <BsThreeDots tabIndex={2} role='button' className='active:fill-sky-600' />
      <ul
        tabIndex={2}
        className='dropdown-content menu bg-slate-100 dark:bg-[#1E2732]  border-gray-200 border rounded-box z-[1] w-max   p-2 shadow'>
        {isBelongsToAuthUser && (
          <>
            <li>
              <span
                className='flex items-center hover:text-red-500 '
                onClick={() => {
                  const elem = document.activeElement;
                  if (elem) {
                    elem?.blur();
                  }

                  onDeleteClick(id);
                }}>
                <FaTrash className='cursor-pointer  ' />

                <a>Delete post</a>
              </span>
            </li>

            {isOriginal && (
              <li className='p-0'>
                <span
                  className='flex items-center justify-start'
                  onClick={() => {
                    console.log(id);
                    pinPost({ postId: id });
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
        {!isBelongsToAuthUser && (
          <>
            {!isFollowing && (
              <li className=''>
                <span
                  className=' flex font-bold '
                  onClick={(e) => {
                    e.preventDefault();
                    follow(owner._id);
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
                  <a>Follow @{owner?.username}</a>
                </span>
              </li>
            )}
            {isFollowing && (
              <li className=''>
                <span
                  className=' flex font-bold '
                  onClick={(e) => {
                    e.preventDefault();
                    follow(owner._id);
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
                  <a>Unfollow @{owner?.username}</a>
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
