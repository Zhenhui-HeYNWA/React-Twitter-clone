import { BiRepost } from 'react-icons/bi';
import { TbPinnedFilled } from 'react-icons/tb';

const PostStatus = ({
  isOriginalPost,
  isAuthUserRepost,
  postUser,
  isPinnedPost,
}) => {
  console.log(isOriginalPost);

  return (
    <>
      {!isOriginalPost && !isAuthUserRepost && (
        <span className='px-14 flex text-slate-500 text-xs font-bold mt-2'>
          {' '}
          <BiRepost className='w-4 h-4  text-slate-500' />
          {postUser.username} reposted
        </span>
      )}
      {!isOriginalPost && isAuthUserRepost && (
        <span className='px-14 flex text-slate-500 text-xs font-bold mt-2'>
          {' '}
          <BiRepost className='w-4 h-4  text-slate-500' />
          You reposted
        </span>
      )}
      {isOriginalPost && isPinnedPost && (
        <span className='px-14 flex text-slate-500 text-xs font-bold mt-2 '>
          {' '}
          <TbPinnedFilled className='w-4 h-4  text-slate-500' />
          Pinned post
        </span>
      )}
    </>
  );
};
export default PostStatus;
