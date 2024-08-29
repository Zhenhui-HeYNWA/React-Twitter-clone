const RenderImg = ({ imgs, onImgClick, size }) => {
  console.log(size);
  return (
    <>
      {size === 'sm' ? (
        <div
          className={
            imgs.length === 1
              ? ' w-32 h-32  overflow-hidden rounded-3xl'
              : imgs.length === 2
              ? 'grid grid-cols-2  gap-1 w-32 h-32  overflow-hidden rounded-xl'
              : imgs.length === 3
              ? 'grid grid-cols-4 grid-rows-2 gap-1 rounded-2xl w-32 h-32  overflow-hidden'
              : imgs.length === 4
              ? 'grid grid-cols-2 grid-rows-2  gap-1  rounded-2xl w-32 h-32  overflow-hidden'
              : 'grid grid-cols-4 rounded-2xl w-32 h-32  overflow-hidden'
          }>
          {imgs.map((img, index) => (
            <>
              <img
                key={index}
                src={img}
                className={
                  imgs.length === 1
                    ? ' object-cover  border-gray-700 h-full w-full '
                    : imgs.length === 2
                    ? '  object-cover  border-gray-700 w-full h-full gap-1 '
                    : imgs.length === 3 && index === 0
                    ? 'col-span-2 row-span-2  object-cover border-gray-700 h-full  w-full'
                    : imgs.length === 3
                    ? 'col-span-2 row-span-1 md:object-cover object-cover border-gray-700 h-full w-full'
                    : imgs.length === 4
                    ? 'object-cover border-gray-700 w-full h-full aspect-square'
                    : 'object-cover rounded-lg border-gray-700 w-full'
                }
                alt={`Post image ${index + 1}`}
                onClick={(e) => onImgClick(e, index)}
              />
              <dialog id={`my_modal_${index}`} className='modal'>
                <div className='modal-box bg-slate-300'>
                  <form method='dialog'>
                    <button className='btn btn-xs btn-circle btn-ghost absolute right-2 top-2'>
                      ✕
                    </button>
                  </form>
                  <img
                    src={img}
                    className='h-full w-full object-fill rounded-lg border-gray-700 mt-2'
                    alt=''
                  />
                </div>
              </dialog>
            </>
          ))}
        </div>
      ) : (
        <div
          className={
            imgs.length === 1
              ? ' h-max max-h-128     w-full  overflow-hidden'
              : imgs.length === 2
              ? 'grid grid-cols-2  gap-1  max-h-128 h-max   md:h-96 overflow-hidden'
              : imgs.length === 3
              ? 'grid grid-cols-4 grid-rows-2 gap-1   max-h-128 w-full h-52 sm:h-72  md:h-96 overflow-hidden'
              : imgs.length === 4
              ? 'grid grid-cols-2 grid-rows-2  gap-1   max-h-128 w-full h-auto overflow-hidden'
              : 'grid grid-cols-4  max-h-128 md:max-h-96 h-96 w-full overflow-hidden'
          }>
          {imgs.map((img, index) => (
            <>
              <img
                key={index}
                src={img}
                className={
                  imgs.length === 1
                    ? ' object-contain  border-gray-700 max-h-128 '
                    : imgs.length === 2
                    ? ' h-full md:h-full object-cover  border-gray-700 w-full'
                    : imgs.length === 3 && index === 0
                    ? 'col-span-2 row-span-2  object-cover border-gray-700 h-full  w-full'
                    : imgs.length === 3
                    ? 'col-span-2 row-span-1 md:object-cover object-cover border-gray-700 h-full w-full'
                    : imgs.length === 4
                    ? 'object-cover border-gray-700 w-full h-full aspect-square'
                    : 'object-cover rounded-lg border-gray-700 w-full'
                }
                alt={`Post image ${index}`}
                onClick={() => onImgClick(index)}
              />
              <dialog id={`my_modal_${index}`} className='modal'>
                <div className='modal-box bg-slate-300'>
                  <form method='dialog'>
                    <button className='btn btn-xs btn-circle btn-ghost absolute right-2 top-2'>
                      ✕
                    </button>
                  </form>
                  <img
                    src={img}
                    className='h-full w-full object-fill rounded-lg border-gray-700 mt-2'
                    alt=''
                  />
                </div>
              </dialog>
            </>
          ))}
        </div>
      )}
    </>
  );
};

export default RenderImg;
