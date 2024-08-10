import { useQuery } from '@tanstack/react-query';
import { FaRegBookmark, FaRegHeart, FaTrash } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import LoadingSpinner from './LoadingSpinner';
import { BiComment, BiRepost } from 'react-icons/bi';
import { formatPostDate } from '../../utils/date';
import useCommentMutations from '../../hooks/useCommentMutations';

const RenderSubComments = ({ postComment }) => {
  const { data: authUser } = useQuery({ queryKey: ['authUser'] });

  const isMyComment = authUser._id === postComment?.user._id;

  const navigate = useNavigate();
  const formattedPostDate = postComment
    ? formatPostDate(postComment.createdAt)
    : '';

  const handleNavigate = () => {
    navigate(
      `/${postComment?.postId}/comment/${postComment?.user?.username}/${postComment?._id}`
    );
  };

  const { replyComment, isReplying, deleteComment, isCommentDeleting } =
    useCommentMutations();

  const handleDeleteComment = (commentId) => {
    console.log(commentId);
    if (isCommentDeleting) return;
    deleteComment({ commentId });
  };
  return (
    <div className=' flex flex-col flex-1 justify-center py-2  '>
      <div className='flex flex-col gap-2 justify-between px-4 '>
        <div className='flex gap-4  '>
          <div className='flex flex-col  items-center'>
            <div className=' avatar '>
              {/* Avatar */}
              <Link
                to={`/profile/${postComment?.user.profileImg}`}
                className='w-12 h-12 rounded-full overflow-hidden block'>
                <img
                  src={
                    postComment?.user.profileImg || '/avatar-placeholder.png'
                  }
                  alt=''
                />
              </Link>
              {/* <div className='absolute left-[calc(50%)] top-[3rem] w-0.5 bg-gray-300 h-[calc(100%+2rem)]'></div> */}
            </div>
          </div>

          <div className='flex flex-col w-full gap-1'>
            <div className='flex items-center justify-between '>
              <div className='flex flex-row items-center justify-start gap-1'>
                <Link
                  to={`/profile/${postComment?.user.username}`}
                  className='font-bold'>
                  {postComment?.user.fullName}
                </Link>

                {/* username */}
                <span className='text-gray-700 flex gap-1 text-base'>
                  <Link to={`/profile/${postComment?.user.username}`}>
                    @{postComment?.user.username}
                  </Link>
                </span>
                <span className='text-base text-gray-700'>·</span>
                <span className='text-base text-gray-700 flex gap-1'>
                  {formattedPostDate}
                </span>
              </div>
              {isMyComment && (
                <div className='flex justify-end items-center'>
                  <span className='flex justify-end flex-1'>
                    {!isCommentDeleting && (
                      <FaTrash
                        className='cursor-pointer hover:text-red-500'
                        onClick={() => handleDeleteComment(postComment._id)}
                      />
                    )}
                    {isCommentDeleting && <LoadingSpinner size='sm' />}
                  </span>
                </div>
              )}
            </div>

            {/* comment text section */}
            <div
              className='flex flex-col overflow-hidden'
              onClick={handleNavigate}>
              <span className='text-lg'>{postComment?.text}</span>
            </div>

            {/* comment functions section*/}
            <div className='flex flex-row items-center justify-between '>
              <div className='flex gap-1 items-center cursor-pointer group'>
                <BiComment className='w-4 h-4 text-slate-500 group-hover:text-sky-400' />
                <span className='text-sm text-slate-500 group-hover:text-sky-400'>
                  0
                </span>{' '}
              </div>

              <div className='flex items-center group cursor-pointer gap-1'>
                <BiRepost
                  className={`w-6 h-6 text-slate-500 group-hover:text-green-500`}
                />
                <span
                  className='text-sm group-hover:text-green-500 
                text-slate-500'>
                  0
                </span>
              </div>
              {/* like post  */}
              <div className='flex gap-1 items-center group cursor-pointer'>
                <FaRegHeart className='w-4 h-4 cursor-pointer text-slate-500 group-hover:text-pink-500' />
                <span
                  className={`text-sm group-hover:text-pink-500 
                text-slate-500`}>
                  0
                </span>
              </div>
              {/* bookmark */}
              <div className='flex gap-2 group items-center'>
                <FaRegBookmark className='w-4 h-4 text-slate-500 cursor-pointer group-hover:fill-black' />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RenderSubComments;
