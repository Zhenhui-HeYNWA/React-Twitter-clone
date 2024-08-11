import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import CommentSkeleton from '../skeletons/CommentSkeleton';
import RenderSubComments from './RenderSubComments';

const CommentSections = ({ feedType, username, userId }) => {
  const {
    data: replies,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['replies'],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/comments/${userId}/comment`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Something went wrong');

        return data;
      } catch (error) {
        throw new Error(error);
      }
    },
  });
  useEffect(() => {
    refetch();
  }, [feedType, refetch, username]);
  console.log(replies);
  const comment = replies?.map((reply) => {
    return reply;
  });
  console.log('123123', comment);
  return (
    <>
      {isLoading && (
        <div className='flex flex-col'>
          <CommentSkeleton />
          <CommentSkeleton />
          <CommentSkeleton />
        </div>
      )}
      <div>
        {replies?.map((reply) => {
          return (
            <div key={reply?._id} className='border-b-2'>
              <RenderSubComments postComment={reply} />
            </div>
          );
        })}
      </div>
    </>
  );
};

export default CommentSections;
