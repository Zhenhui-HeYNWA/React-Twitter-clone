import { Link, useNavigate } from 'react-router-dom';
import { formatPostDate } from '../../utils/date';
import RenderImg from './RenderImg/RenderImg';

const QuotePost = ({ post, isOriginalPost }) => {
  const quotePost = post?.quote;

  const formattedDate = formatPostDate(post?.originalCreatedAt);
  const navigate = useNavigate();
  const handleModalImgClick = (e, index) => {
    e.stopPropagation(); // This will prevent event propagation
    document.getElementById(`my_modal_${index}`).showModal(); // Open the modal
  };
  const RenderQuotePostLink = ({ text }) => {
    const validText = text || '';

    const regexLink = /(\/[a-zA-Z0-9_]+\/status\/[a-zA-Z0-9]+)/;

    const parts = validText.split(regexLink);
    return (
      <div>
        {parts.map((part, index) => {
          if (regexLink.test(part)) {
            return (
              <Link
                key={index}
                to={part}
                className='text-blue-500 hover:underline'>
                {part}
              </Link>
            );
          }

          return <span key={index}>{part}</span>;
        })}
      </div>
    );
  };

  // Check if either post.imgs or post.repost.originalImgs have images
  const postHasImgs =
    (isOriginalPost && Array.isArray(post?.imgs) && post?.imgs.length > 0) ||
    (!isOriginalPost &&
      Array.isArray(post?.repost?.originalImgs) &&
      post?.repost.originalImgs.length > 0);

  const shouldShowOriginalImgs =
    isOriginalPost && quotePost.originalImgs.length > 0 && postHasImgs; // 条件1和3

  const shouldShowRepostImgs =
    !isOriginalPost && quotePost.repost.originalImgs?.length > 0 && postHasImgs;

  return (
    <>
      {shouldShowOriginalImgs || shouldShowRepostImgs ? (
        <div className='h-48 w-full rounded-2xl border border-gray-200  dark:border-slate-700 px-3 pt-4 mt-2'>
          <Link to={`/profile/${quotePost?.originalUser.username}`}>
            <div className='flex items-center gap-2 w-full'>
              <div className='avatar w-7  '>
                <img
                  src={quotePost?.originalUser.profileImg}
                  className='w-7 h-7 rounded-full'
                />
              </div>

              <div className=' flex  w-full gap-1  '>
                <span className='font-bold  text-ellipsis   text-nowrap overflow-hidden w-fit max-w-28 sm:max-w-fit flex-1 '>
                  {quotePost?.originalUser.fullName}
                </span>
                <div className=' flex-1 flex gap-1 '>
                  <span className='text-gray-500 truncate overflow-hidden     max-w-12 sm:max-w-52  '>
                    @{quotePost?.originalUser.username}
                  </span>
                  <div className=' flex-1 gap-1 flex '>
                    <span className='text-gray-500 text-nowrap '>·</span>
                    <span className='text-gray-500  text-nowrap'>
                      {formattedDate}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Link>

          <div
            className='post items-center flex flex-row  gpa-2 mt-4 w-full h-28  cursor-pointer '
            onClick={() =>
              navigate(
                `/${quotePost?.originalUser.username}/status/${quotePost?.originalPost}`
              )
            }>
            <div className='w-32 h-32 rounded-2xl  pb-2 cursor-pointer'>
              {isOriginalPost && quotePost.originalImgs.length > 0 && (
                <>
                  <div className='w-32 h-32 rounded-2xl  pb-2 cursor-pointer'>
                    <RenderImg
                      imgs={
                        quotePost?.originalImgs ||
                        quotePost?.repost?.originalImgs
                      }
                      onImgClick={(e, index) => handleModalImgClick(e, index)} // Pass the event and index
                      size='sm'
                    />
                  </div>
                  <div className='px-2 w-full  h-32 py-1  '>
                    <div className=' text-base w-full h-full  whitespace-pre-wrap word-wrap line-clamp-5 '>
                      <RenderQuotePostLink text={quotePost?.originalText} />
                    </div>
                  </div>
                </>
              )}
              {!isOriginalPost && quotePost.repost.originalImgs?.length > 0 && (
                <RenderImg
                  imgs={
                    quotePost?.originalImgs || quotePost?.repost?.originalImgs
                  }
                  onImgClick={(e, index) => handleModalImgClick(e, index)} // Pass the event and index
                  size='sm'
                />
              )}
            </div>
            <div className='px-2 w-full  h-32 py-1  '>
              <div className=' text-base w-full h-full  whitespace-pre-wrap word-wrap line-clamp-5'>
                <RenderQuotePostLink text={quotePost?.originalText} />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className='border border-gray-200  dark:border-slate-700 rounded-2xl overflow-hidden  pt-4 mt-2 '>
          <div className='flex items-center gap-2 w-full px-3'>
            <div className='avatar w-7  '>
              <img
                src={quotePost?.originalUser.profileImg}
                className='w-7 h-7 rounded-full'
              />
            </div>

            <div className=' flex  w-full gap-1  '>
              <span className='font-bold  text-ellipsis   text-nowrap overflow-hidden w-fit max-w-28 sm:max-w-fit flex-1 '>
                {quotePost?.originalUser.fullName}
              </span>
              <div className=' flex-1 flex gap-1 '>
                <span className='text-gray-500 truncate overflow-hidden     max-w-12 sm:max-w-52  '>
                  @{quotePost?.originalUser.username}
                </span>
                <div className=' flex-1 gap-1 flex '>
                  <span className='text-gray-500 text-nowrap '>·</span>
                  <span className='text-gray-500  text-nowrap'>
                    {formattedDate}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className='py-2 px-4'>
            <div className=' text-base w-full h-full  whitespace-pre-wrap word-wrap line-clamp-5'>
              <RenderQuotePostLink text={quotePost?.originalText} />{' '}
            </div>
          </div>
          {isOriginalPost && quotePost?.originalImgs.length > 0 && (
            <RenderImg
              imgs={quotePost?.originalImgs || quotePost?.repost?.originalImgs}
              onImgClick={(e, index) => handleModalImgClick(e, index)} // Pass the event and index
              size='lg'
            />
          )}

          {!isOriginalPost && quotePost?.repost.originalImgs?.length > 0 && (
            <RenderImg
              imgs={quotePost?.originalImgs || quotePost?.repost?.originalImgs}
              onImgClick={(e, index) => handleModalImgClick(e, index)} // Pass the event and index
              size='sm'
            />
          )}
        </div>
      )}
    </>
  );
};

export default QuotePost;
