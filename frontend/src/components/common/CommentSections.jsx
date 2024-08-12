import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import CommentSkeleton from '../skeletons/CommentSkeleton';
import RenderSubComments from './RenderSubComments';

const CommentSections = ({ userId }) => {
  const {
    data: replies,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['replies', userId], // Include userId in the queryKey to make it unique per user
    queryFn: async () => {
      const res = await fetch(`/api/comments/${userId}/comment`);
      if (!res.ok) throw new Error('Something went wrong');
      return res.json();
    },
  });

  useEffect(() => {
    refetch(); // Refetch when userId changes
  }, [refetch, userId]);

  return (
    <>
      {(isLoading || isRefetching) && (
        <div className='flex flex-col'>
          <CommentSkeleton />
          <CommentSkeleton />
          <CommentSkeleton />
        </div>
      )}

      {!isLoading && !isRefetching && replies?.length === 0 && (
        <p className='text-center my-4'>No comments available.</p>
      )}

      {!isLoading &&
        !isRefetching &&
        replies?.map((reply) => (
          <div
            key={reply?._id}
            className='border-b border-gray-200 dark:border-gray-700'>
            <RenderSubComments postComment={reply} />
          </div>
        ))}
    </>
  );
};

export default CommentSections;
