import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Link } from 'react-router-dom';
import FollowingSkeleton from '../skeletons/FollowingSkeleton';
import useFollow from './hooks/useFollow';
const FollowAndFollowing = ({ feedType, username }) => {
  const getPostEndPoint = () => {
    switch (feedType) {
      case 'following':
        return `/api/users/following/${username}`;
      case 'followers':
        return `/api/users/follower/${username}`;
      default:
        return `/api/users/following/${username}`;
    }
  };

  const { data: authUser, isLoading: authLoading } = useQuery({
    queryKey: ['authUser'],
  });

  const FetchEndPoint = getPostEndPoint();

  const { follow, isPending } = useFollow();

  const {
    data: relationships,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      try {
        const res = await fetch(FetchEndPoint);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Something went wrong');
        return data;
      } catch (error) {
        throw new Error(error);
      }
    },
  });

  // Ensure authUser is loaded before proceeding
  useEffect(() => {
    if (!authLoading) {
      refetch();
    }
  }, [username, refetch, feedType, authLoading]);

  return (
    <>
      {authLoading && <p>Loading...</p>}
      {!isLoading && !isRefetching && relationships?.length === 0 && (
        <>
          <p className='text-center my-4 text-lg font-bold'>
            Looking for followers?
          </p>
          <p className='text-center my-4 text-gray-500'>
            When someone follows this account, they&apos;ll show up here.
            Posting and interacting with others helps boost followers.
          </p>
        </>
      )}
      {(isLoading || isRefetching) && (
        <>
          <FollowingSkeleton />
          <FollowingSkeleton />
          <FollowingSkeleton />
          <FollowingSkeleton />
          <FollowingSkeleton />
          <FollowingSkeleton />
        </>
      )}
      {!isLoading &&
        !isRefetching &&
        relationships?.map((relationship) => {
          const isFollowing = authUser?.followings.includes(relationship._id);
          const isMySelf = authUser?._id === relationship._id; // Use _id to compare

          return (
            <div
              className='border-gray-200 dark:border-gray-700 p-6'
              key={relationship._id}>
              <Link
                to={`/profile/${relationship.username}`}
                className='flex items-center justify-between gap-4'>
                <div className='flex gap-2 items-center'>
                  <div className='avatar'>
                    <div className='w-8 rounded-full'>
                      <img
                        src={
                          relationship.profileImg || '/avatar-placeholder.png'
                        }
                        alt={`${relationship.username}'s profile`}
                      />
                    </div>
                  </div>
                  <div className='flex flex-col'>
                    <span className='font-semibold tracking-tight truncate w-28'>
                      {relationship.fullName}
                    </span>
                    <span className='text-sm text-slate-500'>
                      @{relationship.username}
                    </span>
                    <span className='font-basic tracking-tight truncate w-72'>
                      {relationship.bio}
                    </span>
                  </div>
                </div>
                <div>
                  {!isMySelf && (
                    <button
                      className='btn bg-white text-black hover:bg-white hover:opacity-90 rounded-full btn-sm'
                      onClick={(e) => {
                        e.preventDefault();
                        follow(relationship._id).then(() => {
                          refetch(); // Refetch the data after following/unfollowing
                        });
                      }}
                      disabled={isPending}>
                      {isPending && 'Loading...'}
                      {!isPending && isFollowing ? 'Following' : 'Follow'}
                    </button>
                  )}
                </div>
              </Link>
            </div>
          );
        })}
    </>
  );
};

export default FollowAndFollowing;
