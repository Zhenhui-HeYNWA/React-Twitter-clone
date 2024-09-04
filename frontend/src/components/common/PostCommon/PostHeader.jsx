import { Link } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import { TbPinnedFilled } from 'react-icons/tb';
import { BiRepost } from 'react-icons/bi';

const PostHeader = ({ post, authUser }) => {
  const isOriginalPost = post?.repost?.originalPost == null;
  const isPinnedPost = post?.user?.pinnedPost[0] === post?._id;
  const isAuthUserRepost = post?.user._id === authUser?._id;

  return (
    <>
      <div className='sticky top-0 z-10 w-full backdrop-blur-2xl px-4 py-2'>
        <div className='flex gap-10 py-1 items-center'>
          <Link to='/'>
            <FaArrowLeft className='w-4 h-4' />
          </Link>
          <div className='flex flex-col'>
            <p className='font-bold text-lg'>Post</p>
          </div>
        </div>
      </div>

      {!isOriginalPost && !isAuthUserRepost && (
        <span className='px-14 flex text-slate-500 text-xs font-bold mt-2'>
          <BiRepost className='w-4 h-4 text-slate-500' />
          {post.user.username} reposted
        </span>
      )}

      {!isOriginalPost && isAuthUserRepost && (
        <span className='px-14 flex text-slate-500 text-xs font-bold mt-2'>
          <BiRepost className='w-4 h-4 text-slate-500' />
          You reposted
        </span>
      )}

      {isOriginalPost && isPinnedPost && (
        <span className='px-14 flex text-slate-500 text-xs font-bold mt-2'>
          <TbPinnedFilled className='w-4 h-4 text-slate-500' />
          Pinned post
        </span>
      )}
    </>
  );
};

export default PostHeader;
