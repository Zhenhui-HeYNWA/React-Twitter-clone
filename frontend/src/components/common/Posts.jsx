import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';

import Post from './Post';
import PostSkeleton from '../skeletons/PostSkeleton';
import RenderSubComments from './RenderSubComments';

const Posts = ({ feedType, username, user }) => {
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
    data: items = [], // Provide a default value to avoid potential undefined issues
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['posts', feedType, username], // Include feedType and username to refetch data based on these dependencies
    queryFn: async () => {
      try {
        console.log('Starting fetch to:', POST_ENDPOINT);
        const res = await fetch(POST_ENDPOINT);
        console.log('Fetch response status:', res.status);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Something went wrong');
        return data;
      } catch (error) {
        throw new Error(error.message || 'Something went wrong during fetch');
      }
    },
    onError: (error) => {
      console.error('Error during useQuery:', error);
    },
  });

  const handlePinnedPost = useCallback(
    (data) => {
      if (user?.pinnedPost?.length > 0 && feedType === 'posts') {
        const pinnedIndex = data.findIndex(
          (item) => item._id === user.pinnedPost[0]
        );

        if (pinnedIndex > 0) {
          const [pinnedPost] = data.splice(pinnedIndex, 1);
          data.unshift(pinnedPost);
        }
      }
      return data;
    },
    [user?.pinnedPost, feedType]
  );

  useEffect(() => {
    refetch(); // Refetch posts when feedType or username changes
  }, [feedType, refetch, username]);

  const processedItems = handlePinnedPost(items);

  return (
    <>
      {(isLoading || isRefetching) && (
        <div className='flex flex-col justify-center'>
          <PostSkeleton />
          <PostSkeleton />
          <PostSkeleton />
        </div>
      )}
      {!isLoading && !isRefetching && processedItems.length === 0 && (
        <p className='text-center my-4'>No posts in this tab. Switch 👻</p>
      )}
      {!isLoading && !isRefetching && processedItems.length > 0 && (
        <div>
          {processedItems.map((item) => {
            if (item.img || item.repost) {
              // Render posts
              return (
                <Post
                  key={item._id}
                  post={item}
                  posts={processedItems}
                  feedType={feedType}
                  user={user}
                  username={username}
                />
              );
            } else if (item.postId) {
              // Render comments
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
