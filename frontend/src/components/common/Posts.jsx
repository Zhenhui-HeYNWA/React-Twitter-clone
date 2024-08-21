import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

import Post from './Post';
import PostSkeleton from '../skeletons/PostSkeleton';

import RenderSubComments from './RenderSubComments';

const Posts = ({ feedType, username }) => {
  const getPostEndPoint = () => {
    switch (feedType) {
      case 'forYou':
        return '/api/posts/all';
      case 'following':
        return '/api/posts/following';
      case 'posts':
        return `/api/posts/user/${username}`;
      case 'likes':
        return `/api/users/likes/${username}`;
      case 'bookmarks':
        return `/api/users/bookmarks/${username}`;
      default:
        return '/api/posts/all';
    }
  };

  const POST_ENDPOINT = getPostEndPoint();

  const {
    data: items,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      try {
        console.log('Starting fetch to:', POST_ENDPOINT); // Log the endpoint
        const res = await fetch(POST_ENDPOINT);
        console.log('Fetch response status:', res.status); // Log the response status
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Something went wrong');

        return data;
      } catch (error) {
        throw new Error(error);
      }
    },
    onError: (error) => {
      console.error('Error during useQuery:', error); // Log any errors during useQuery
    },
  });
  useEffect(() => {
    refetch();
  }, [feedType, refetch, username]);

  return (
    <>
      {(isLoading || isRefetching) && (
        <div className='flex flex-col justify-center'>
          <PostSkeleton />
          <PostSkeleton />
          <PostSkeleton />
        </div>
      )}
      {!isLoading && !isRefetching && items?.length === 0 && (
        <p className='text-center my-4'>No posts in this tab. Switch 👻</p>
      )}
      {!isLoading && !isRefetching && items && (
        <div>
          {items.map((item) => {
            if (item.img || item.repost) {
              // Assuming that only posts have these fields
              return <Post key={item._id} post={item} posts={items} />;
            } else if (item.postId) {
              // Assuming that comments have a postId field
              return <RenderSubComments key={item._id} postComment={item} />;
            }
            return null;
          })}
        </div>
      )}
    </>
  );
};
export default Posts;
