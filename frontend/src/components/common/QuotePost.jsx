import { formatDateTime } from '../../utils/date';

const QuotePost = ({ post, isOriginalPost }) => {
  const formattedDate = post ? formatDateTime(post.createdAt) : '';
  return (
    <div className='border rounded-2xl '>
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
        <div
          className={
            post.imgs.length === 1
              ? 'w-full rounded-xl'
              : post.imgs.length === 2
              ? 'grid grid-cols-2 rounded-2xl max-h-128 h-96 overflow-hidden'
              : post.imgs.length === 3
              ? 'grid grid-cols-4 grid-rows-2  rounded-2xl max-h-128 w-full h-96 overflow-hidden'
              : post.imgs.length === 4
              ? 'grid grid-cols-2 grid-rows-2  rounded-2xl max-h-128 w-full h-auto overflow-hidden'
              : 'grid grid-cols-4 rounded-2xl max-h-128 md:max-h-96 h-96 w-full overflow-hidden'
          }>
          {post.imgs.map((img, index) => (
            <>
              <img
                key={index}
                src={img}
                className={
                  post.imgs.length === 1
                    ? 'object-cover rounded-lg border-gray-700 max-h-128 w-full'
                    : post.imgs.length === 2
                    ? 'h-full object-cover border-gray-700 w-full'
                    : post.imgs.length === 3 && index === 0
                    ? 'col-span-2 row-span-2 object-cover border-gray-700 h-full w-full'
                    : post.imgs.length === 3
                    ? 'col-span-2 row-span-1 object-cover border-gray-700 h-full w-full'
                    : post.imgs.length === 4
                    ? 'object-cover border-gray-700 w-full h-full aspect-square'
                    : 'object-cover rounded-lg border-gray-700 w-full'
                }
                alt={`Post image ${index + 1}`}
                onClick={() =>
                  document.getElementById(`my_modal_${index}`).showModal()
                }
              />

              <dialog id={`my_modal_${index}`} className=' modal  '>
                <div className=' modal-box bg-slate-300 '>
                  <form method='dialog'>
                    <button className='btn btn-xs btn-circle btn-ghost absolute right-2 top-2 '>
                      ✕
                    </button>
                  </form>
                  <img
                    src={img}
                    className='h-full w-full object-fill   rounded-lg  border-gray-700 mt-2 '
                    alt=''
                  />
                </div>
              </dialog>
            </>
          ))}
        </div>
      )}

      {!isOriginalPost && post.repost.originalImgs?.length > 0 && (
        <div
          className={
            post.repost.originalImgs.length === 1
              ? 'w-full rounded-xl'
              : post.repost.originalImgs.length === 2
              ? 'grid grid-cols-2 rounded-2xl max-h-128 h-96 overflow-hidden'
              : post.repost.originalImgs.length === 3
              ? 'grid grid-cols-4 grid-rows-2  rounded-2xl max-h-128 w-full h-96 overflow-hidden'
              : post.repost.originalImgs.length === 4
              ? 'grid grid-cols-2 grid-rows-2  rounded-2xl max-h-128 w-full h-auto overflow-hidden'
              : 'grid grid-cols-4 rounded-2xl max-h-128 md:max-h-96 h-96 w-full overflow-hidden'
          }>
          {post.repost.originalImgs.map((img, index) => (
            <img
              key={index}
              src={img}
              className={
                post.repost.originalImgs.length === 1
                  ? 'object-cover rounded-lg border-gray-700 max-h-128 w-full'
                  : post.repost.originalImgs.length === 2
                  ? 'h-full object-cover border-gray-700 w-full'
                  : post.repost.originalImgs.length === 3 && index === 0
                  ? 'col-span-2 row-span-2 object-cover border-gray-700 h-full w-full'
                  : post.repost.originalImgs.length === 3
                  ? 'col-span-2 row-span-1 object-cover border-gray-700 h-full w-full'
                  : post.repost.originalImgs.length === 4
                  ? 'object-cover border-gray-700 w-full h-full aspect-square'
                  : 'object-cover rounded-lg border-gray-700 w-full'
              }
              alt={`Post image ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default QuotePost;
