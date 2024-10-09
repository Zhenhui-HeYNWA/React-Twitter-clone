import { Link } from 'react-router-dom';
import { formatPostDate } from '../../../utils/date';

const PostAuthorDetail = ({ postUser, date, type }) => {
  const formattedDate = formatPostDate(date);

  return (
    <div>
      {type === 'main' ? (
        <div className='flex flex-row gap-1 items-center max-w-sm '>
          {/* fullName */}

          <Link to={`/profile/${postUser.username}`}>
            <span className=' font-bold text-nowrap '>{postUser.fullName}</span>
          </Link>
          <span className=' flex gap-1 text-basic '>
            <span className='text-gray-500 truncate max-w-16 md:max-w-52 text-basic'>
              <Link to={`/profile/${postUser.username}`}>
                <span>@{postUser.username}</span>
              </Link>
            </span>
            <span className='text-gray-500 text-nowrap'>·</span>
            <span className='text-gray-500 text-nowrap'>{formattedDate}</span>
          </span>
        </div>
      ) : (
        <div className='flex flex-col'>
          <div className=' font-bold '>{postUser.username}</div>
          <Link to={`/profile/${postUser.username}`}>
            <div className='text-gray-500 flex text-base'>
              @{postUser.fullName}
            </div>
          </Link>
        </div>
      )}
    </div>
  );
};

export default PostAuthorDetail;
