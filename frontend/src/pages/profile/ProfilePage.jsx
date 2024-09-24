import { Link, useParams } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';

import { FaArrowLeft, FaLink } from 'react-icons/fa';
import { MdEdit } from 'react-icons/md';
import { IoCalendarOutline } from 'react-icons/io5';

import ProfileHeaderSkeleton from '../../components/skeletons/ProfileHeaderSkeleton';
import EditProfileModal from './EditProfileModal';
import Posts from '../../components/common/Posts';
import CommentSections from '../../components/common/Comments/CommentSections';
import { useQuery } from '@tanstack/react-query';
import { formatMemberSinceDate } from '../../utils/date';
import useFollow from '../../hooks/useFollow';
import useUpdateProfile from '../../hooks/useUpdateProfile';

const ProfilePage = () => {
  const [coverImg, setCoverImg] = useState(null);
  const [profileImg, setProfileImg] = useState(null);
  const [feedType, setFeedType] = useState('posts');
  const [isCoverTheButton, setIsCoverTheButton] = useState(false);

  const coverImgRef = useRef(null);
  const profileImgRef = useRef(null);
  const scrollingRef = useRef(false);

  const { username } = useParams();

  const { data: authUser } = useQuery({
    queryKey: ['authUser'],
  });

  const { follow, isPending } = useFollow();

  const {
    data: user,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/users/profile/${username}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Something went wrong');
        return data;
      } catch (error) {
        throw new Error(error.message);
      }
    },
  });

  const isMyProfile = authUser?._id === user?._id;

  const { data: getFollowersIKnow, refetch: refetchFollowersIKnow } = useQuery({
    queryKey: ['CommentUserFollower', username],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/users/follower/${username}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Something went wrong');

        // 计算 commonFollowers
        if (!authUser?.followings) return [];
        return data.filter((follower) =>
          authUser.followings.includes(follower._id)
        );
      } catch (error) {
        throw new Error(error);
      }
    },
    enabled: !isMyProfile,
  });

  const { isUpdateProfile, updateProfile } = useUpdateProfile();

  const joinDate = formatMemberSinceDate(user?.createdAt);

  const amIFollowing = authUser?.followings?.includes(user?._id);

  const handleImgChange = (e, state) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (state === 'coverImg') setCoverImg(reader.result);
        if (state === 'profileImg') setProfileImg(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    refetch();
    refetchFollowersIKnow();
  }, [username, refetch, refetchFollowersIKnow]);

  useEffect(() => {
    const handleScroll = () => {
      if (!scrollingRef.current) {
        scrollingRef.current = true;
        requestAnimationFrame(() => {
          const scrollPosition = window.scrollY;
          setIsCoverTheButton(scrollPosition > 300);
          scrollingRef.current = false;
        });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    refetch();
  }, [username, refetch]);

  return (
    <>
      <div className=' flex-[4_4_0] border-r border-gray-200 dark:border-gray-700 min-h-screen w-full'>
        {/* HEADER */}
        {(isLoading || isRefetching) && <ProfileHeaderSkeleton />}
        {!isLoading && !isRefetching && !user && (
          <p className='text-center text-lg mt-4'>User not found</p>
        )}

        <div className='flex flex-col h-full  '>
          {!isLoading && !isRefetching && user && (
            <>
              <div className='sticky top-0   z-10 w-full   backdrop-blur-3xl px-4 py-1'>
                <div className=' mx-auto flex items-center  justify-between '>
                  <div className='flex  flex-row items-center gap-10 '>
                    <Link to='/'>
                      <FaArrowLeft className='w-4 h-4 ' />
                    </Link>
                    <div className='flex flex-col '>
                      <p className='font-bold text-lg'>{user?.fullName}</p>
                      <span className='text-sm text-slate-500'>
                        {user.userPosts?.length} posts
                      </span>
                    </div>
                  </div>
                  <div>
                    {!isMyProfile && isCoverTheButton && (
                      <button
                        className='btn btn-outline rounded-full btn-sm '
                        onClick={() => follow(user?._id)}>
                        {isPending && 'Loading...'}
                        {!isPending && amIFollowing && 'Following'}
                        {!isPending && !amIFollowing && 'Follow'}
                      </button>
                    )}
                    {isMyProfile && isCoverTheButton && (
                      <EditProfileModal authUser={authUser} />
                    )}
                  </div>
                </div>
              </div>
              {/* COVER IMG */}
              <div className='relative group '>
                <img
                  src={coverImg || user?.coverImg || '/cover.png'}
                  className='h-30 md:h-60 w-full object-fill'
                  alt='cover image'
                />
                {isMyProfile && (
                  <div
                    className='absolute top-2 right-2 rounded-full p-2 bg-gray-800 bg-opacity-75 cursor-pointer opacity-0 group-hover/cover:opacity-100 transition duration-200'
                    onClick={() => coverImgRef.current.click()}>
                    <MdEdit className='w-5 h-5 text-white' />
                  </div>
                )}

                <input
                  type='file'
                  hidden
                  accept='image/*'
                  ref={coverImgRef}
                  onChange={(e) => handleImgChange(e, 'coverImg')}
                />
                <input
                  type='file'
                  hidden
                  accept='image/*'
                  ref={profileImgRef}
                  onChange={(e) => handleImgChange(e, 'profileImg')}
                />
                {/* USER AVATAR */}
                <div className='avatar absolute -bottom-16 left-4  '>
                  <div className='w-24 sm:w-28 md:w-40   rounded-full  object-contain relative group/avatar border-4 dark:border-[#15202B]'>
                    <img
                      src={
                        profileImg ||
                        user?.profileImg ||
                        '/avatar-placeholder.png'
                      }
                      className='w-full h-full rounded-full object-cover'
                    />
                    {isMyProfile && (
                      <div className='absolute top-5 right-3 p-1 bg-primary rounded-full group-hover/avatar:opacity-100 opacity-0 cursor-pointer'>
                        <MdEdit
                          className='w-4 h-4 text-white'
                          onClick={() => profileImgRef.current.click()}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className='flex justify-end px-4 mt-5 items-center '>
                {isMyProfile && <EditProfileModal authUser={authUser} />}

                {!isMyProfile && (
                  <button
                    className='flex justify-center items-center btn btn-outline rounded-full btn-sm bg-gray-200 text-black px-4 py-2'
                    onClick={() => follow(user?._id)}>
                    {isPending && 'Loading...'}
                    {!isPending && amIFollowing && 'Following'}
                    {!isPending && !amIFollowing && 'Follow'}
                  </button>
                )}
                {(coverImg || profileImg) && (
                  <button
                    className='btn btn-primary rounded-full btn-sm text-white px-4 ml-2'
                    onClick={async () => {
                      await updateProfile({ coverImg, profileImg });
                      setProfileImg(null);
                      setCoverImg(null);
                    }}>
                    {isUpdateProfile ? 'Updating...' : 'Update'}
                  </button>
                )}
              </div>

              <div className='flex flex-col gap-4 mt-14 px-4'>
                <div className='flex flex-col'>
                  <span className='font-bold text-lg'>{user?.fullName}</span>
                  <span className='text-sm text-slate-500'>
                    @{user?.username}
                  </span>
                  <span className='text-sm my-1'>{user?.bio}</span>
                </div>

                <div className='flex gap-2 flex-wrap'>
                  {user?.link && (
                    <div className='flex gap-1 items-center '>
                      <>
                        <FaLink className='w-3 h-3 text-slate-500' />
                        <a
                          href={user.link}
                          target='_blank'
                          rel='noreferrer'
                          className='text-sm text-blue-500 hover:underline'>
                          {user?.link}
                        </a>
                      </>
                    </div>
                  )}
                  <div className='flex gap-2 items-center'>
                    <IoCalendarOutline className='w-4 h-4 text-slate-500' />
                    <span className='text-sm text-slate-500'>{joinDate}</span>
                  </div>
                </div>
                <Link to={`/follow/${user.username}`}>
                  <div className='flex gap-2'>
                    <div className='flex gap-1 items-center'>
                      <span className='font-bold text-sm'>
                        {user?.followings.length}
                      </span>
                      <span className='text-slate-500 text-sm'>Following</span>
                    </div>

                    <div className='flex gap-1 items-center'>
                      <span className='font-bold text-sm'>
                        {user?.followers.length}
                      </span>
                      <span className='text-slate-500 text-sm'>Followers</span>
                    </div>
                  </div>
                </Link>
                {!isMyProfile && getFollowersIKnow?.length > 0 && (
                  <div className='flex flex-row items-center justify-start gap-x-2'>
                    <div className='isolate flex -space-x-2'>
                      {getFollowersIKnow.slice(0, 3).map((follower, index) => (
                        <img
                          key={index}
                          className={`relative inline-block h-6 w-6 rounded-full z-${
                            30 - index * 10
                          }`}
                          src={follower.profileImg}
                          alt={follower.username}
                        />
                      ))}
                    </div>
                    <div className='text-slate-500 text-sm'>
                      <Link
                        className=' hover:underline'
                        to={`/follow/${username}`}
                        state={{ feedType: 'FollowersUKnow' }}>
                        Followed by {getFollowersIKnow[0]?.username}
                        {getFollowersIKnow.length > 1 &&
                          `, ${getFollowersIKnow[1]?.username}`}
                        {getFollowersIKnow.length > 2 &&
                          `, and ${getFollowersIKnow.length - 2} others`}
                      </Link>
                    </div>
                  </div>
                )}
              </div>
              <div className='flex w-full border-b border-gray-700 mt-4'>
                <div
                  className={`flex justify-center flex-1 p-3 ${
                    feedType === 'posts'
                      ? 'text-black  font-bold dark:text-white'
                      : 'text-slate-500'
                  }  transition duration-300 relative cursor-pointer`}
                  onClick={() => setFeedType('posts')}>
                  Posts
                  {feedType === 'posts' && (
                    <div className='absolute bottom-0 w-10 h-1 rounded-full bg-primary' />
                  )}
                </div>

                <div
                  className={`flex justify-center flex-1 p-3 ${
                    feedType === 'replies'
                      ? 'text-black  font-bold dark:text-white'
                      : 'text-slate-500'
                  }  transition duration-300 relative cursor-pointer`}
                  onClick={() => setFeedType('replies')}>
                  Replies
                  {feedType === 'replies' && (
                    <div className='absolute bottom-0 w-10 h-1 rounded-full bg-primary' />
                  )}
                </div>

                <div
                  className={`flex justify-center flex-1 p-3 ${
                    feedType === 'likes'
                      ? 'text-black  font-bold dark:text-white'
                      : 'text-slate-500'
                  }  transition duration-300 relative cursor-pointer`}
                  onClick={() => setFeedType('likes')}>
                  Likes
                  {feedType === 'likes' && (
                    <div className='absolute bottom-0 w-10  h-1 rounded-full bg-primary' />
                  )}
                </div>

                {isMyProfile && (
                  <div
                    className={`flex justify-center flex-1 p-3 ${
                      feedType === 'bookmarks'
                        ? 'text-black  font-bold dark:text-white'
                        : 'text-slate-500'
                    }  transition duration-300 relative cursor-pointer`}
                    onClick={() => setFeedType('bookmarks')}>
                    Bookmarks
                    {feedType === 'bookmarks' && (
                      <div className='absolute bottom-0 w-10  h-1 rounded-full bg-primary' />
                    )}
                  </div>
                )}
              </div>
            </>
          )}
          {feedType === 'replies' ? (
            <CommentSections
              feedType={feedType}
              username={username}
              userId={user?._id}
            />
          ) : (
            <Posts
              feedType={feedType}
              username={username}
              userId={user?._id}
              user={user}
            />
          )}
          {/* <Posts feedType={feedType} username={username} userId={user?._id} /> */}
        </div>
      </div>
    </>
  );
};

export default ProfilePage;
