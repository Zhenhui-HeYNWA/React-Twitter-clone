import { formatDateTime } from '../../utils/date';
import RenderImg from './RenderImg/RenderImg';

const QuotePost = ({ post, isOriginalPost }) => {
  const formattedDate = post ? formatDateTime(post.createdAt) : '';

  const handleModalImgClick = (index) => {
    document.getElementById(`my_modal_${index}`).showModal();
  };

  // Check if either post.imgs or post.repost.originalImgs have images
  const postHasImgs =
    (isOriginalPost && post.imgs.length !== 0) ||
    (!isOriginalPost && post.repost.originalImgs?.length > 0);

  console.log(postHasImgs);

  return (
    <>
      {postHasImgs ? (
        <div className='h-48 w-full rounded-2xl border border-slate-700 px-3 pt-4 mt-2'>
          <div className='flex items-center gap-2 w-full'>
            <div className='avatar w-7 h-7 '>
              <img
                src={post.user.profileImg}
                className='w-7 h-7 rounded-full'
              />
            </div>

            <div className=' flex  w-full gap-1  '>
              <span className='font-bold  text-ellipsis   text-nowrap overflow-hidden w-fit max-w-28 sm:max-w-fit flex-1 bg-black'>
                {post.user.fullName}
              </span>
              <div className=' flex-1 flex   bg-red-500 '>
                <span className='text-slate-400  truncate overflow-hidden     max-w-12 sm:max-w-52  '>
                  @{post.user.username}
                </span>
                <div className=' flex-1 gap-2 flex '>
                  <span className='text-slate-400 text-nowrap '>·</span>
                  <span className='text-slate-400  text-nowrap'>Aug 24</span>
                </div>
              </div>
            </div>
          </div>

          <div className='post items-center flex flex-row  gpa-2 mt-4 w-full h-28  '>
            <div className='w-32 h-32 rounded-2xl  pb-2'>
              {isOriginalPost && post.imgs.length > 0 && (
                <RenderImg
                  imgs={post.imgs}
                  onImgClick={handleModalImgClick}
                  size='sm'
                />
              )}
              {!isOriginalPost && post.repost.originalImgs?.length > 0 && (
                <RenderImg
                  imgs={post.repost.originalImgs}
                  onImgClick={handleModalImgClick}
                  size='sm'
                />
              )}
            </div>
            <div className='px-2 w-full  h-32 py-1  '>
              <div className=' text-base w-full h-full  whitespace-pre-wrap word-wrap line-clamp-5'>
                {post.text}
              </div>
            </div>
          </div>
        </div>
      ) : (
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
              <span className='text-sm'>{formattedDate}</span>
            </div>
          </div>

          <div className='py-2 px-4'>{post.text}</div>
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
      )}
    </>
  );
};

export default QuotePost;
