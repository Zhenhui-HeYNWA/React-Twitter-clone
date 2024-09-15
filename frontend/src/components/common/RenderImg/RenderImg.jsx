import React from 'react';
import { v4 as uuidv4 } from 'uuid';

const RenderImg = ({ imgs, onImgClick, size }) => {
  function getRenderSize() {
    switch (size) {
      case 'lg':
        return 'h-auto w-full max-h-128 ';

      case 'md':
        return ' h-72  w-72 ';
      case 'sm':
        return 'h-32 w-32';
      default:
        return 'h-full w-full';
    }
  }
  return (
    <>
      <div
        className={
          imgs.length === 1
            ? `${getRenderSize()} max-h-128  overflow-hidden `
            : imgs.length === 2
            ? `grid grid-cols-2  gap-1 ${getRenderSize()}  overflow-hidden `
            : imgs.length === 3
            ? `grid grid-cols-4 grid-rows-2 gap-1  ${getRenderSize()}  overflow-hidden`
            : imgs.length === 4
            ? `grid grid-cols-2 grid-rows-2  gap-1   ${getRenderSize()}   overflow-hidden`
            : `grid grid-cols-4  ${getRenderSize()}  overflow-hidden`
          // grid grid-cols-2 grid-rows-2  gap-1    max-h-128 w-full h-auto overflow-hidden
        }>
        {imgs.map((img, index) => (
          <React.Fragment key={uuidv4()}>
            <img
              src={img}
              className={
                imgs.length === 1
                  ? ' object-cover  border-gray-700 h-full  w-full max-h-128'
                  : imgs.length === 2
                  ? '  object-cover  border-gray-700 w-full h-full gap-1 '
                  : imgs.length === 3 && index === 0
                  ? 'col-span-2 row-span-2  object-cover border-gray-700 h-full  w-full'
                  : imgs.length === 3
                  ? 'col-span-2 row-span-1 md:object-cover object-cover border-gray-700 h-full w-full'
                  : imgs.length === 4
                  ? 'object-cover border-gray-700 w-full h-full aspect-square '
                  : 'object-cover rounded-lg border-gray-700 w-full'
              }
              alt={`Post image ${index + 1}`}
              onClick={() => onImgClick(img)}
            />
            <dialog id={`my_modal_${img}`} className='modal'>
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
          </React.Fragment>
        ))}
      </div>
    </>
  );
};

export default RenderImg;
