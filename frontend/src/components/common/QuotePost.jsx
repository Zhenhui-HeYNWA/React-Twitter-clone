import { formatDateTime } from '../../utils/date';
import RenderImg from './RenderImg/RenderImg';

const QuotePost = ({ post, isOriginalPost }) => {
  const formattedDate = post ? formatDateTime(post.createdAt) : '';

  const handleModalImgClick = (index) => {
    document.getElementById(`my_modal_${index}`).showModal();
  };
  return (
    <div className='border rounded-2xl overflow-hidden '>
      <div className=' py-2 px-4'>
        <div className='flex gap-1 items-center'>
          <img
            src={post.user.profileImg}
            alt=''
            className='w-8 h-8 rounded-full'
          />
          <span className='font-bold text-base'>{post.user.fullName}</span>
          <span className='text-sm'>@{post.user.username}</span>
          <span>·</span>
          <span className='text-sm'>08/08/2024</span>
        </div>
      </div>

      <div className='py-2 px-4  '>{post.text}</div>
      {isOriginalPost && post.imgs.length > 0 && (
        <RenderImg imgs={post.imgs} onImgClick={handleModalImgClick} />
      )}

      {!isOriginalPost && post.repost.originalImgs?.length > 0 && (
        <RenderImg
          imgs={post.repost.originalImgs}
          onImgClick={handleModalImgClick}
        />
      )}
    </div>
  );
};

export default QuotePost;
