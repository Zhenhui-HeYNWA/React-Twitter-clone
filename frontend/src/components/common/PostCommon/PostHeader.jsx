import { Link } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';

import PostStatus from './PostStatus/PostStatus';

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

      {post && (
        <PostStatus
          isOriginalPost={isOriginalPost}
          isAuthUserRepost={isAuthUserRepost}
          postUser={post.user}
          isPinnedPost={isPinnedPost}
        />
      )}
    </>
  );
};

export default PostHeader;
