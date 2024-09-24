import { useInfiniteQuery } from '@tanstack/react-query';
import CommentSkeleton from '../../skeletons/CommentSkeleton';
import RenderSubComments from '../RenderSubComments';

const CommentSections = ({ userId }) => {
  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } =
    useInfiniteQuery({
      queryKey: ['replies', userId],
      queryFn: async ({ pageParam = 1 }) => {
        const res = await fetch(
          `/api/comments/${userId}/comment?page=${pageParam}&limit=10`
        );
        if (!res.ok) throw new Error('Something went wrong');
        return res.json();
      },
      getNextPageParam: (lastPage) => {
        return lastPage.currentPage < lastPage.totalPages
          ? lastPage.currentPage + 1
          : false;
      },
    });

  if (isLoading) {
    return (
      <div className='flex flex-col'>
        <CommentSkeleton />
        <CommentSkeleton />
        <CommentSkeleton />
      </div>
    );
  }

  if (data?.pages[0]?.replies.length === 0) {
    return <p className='text-center my-4'>No comments available.</p>;
  }

  return (
    <>
      {data.pages.map((page) =>
        page.replies.map((reply) => (
          <div key={reply._id}>
            <RenderSubComments postComment={reply} pageType={'replies'}/>
          </div>
        ))
      )}

      {isFetchingNextPage && (
        <div className='flex flex-col'>
          <CommentSkeleton />
          <CommentSkeleton />
          <CommentSkeleton />
        </div>
      )}

      {hasNextPage && (
        <div className='text-center my-4'>
          <a
            href='#'
            onClick={(e) => {
              e.preventDefault();
              fetchNextPage();
            }}
            className='text-blue-500 hover:underline'>
            Get more replies
          </a>
        </div>
      )}

      {!hasNextPage && (
        <p className='text-center my-4 text-gray-500'>
          No more replies available.
        </p>
      )}
    </>
  );
};

export default CommentSections;