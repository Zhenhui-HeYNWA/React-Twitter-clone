import { useQuery } from '@tanstack/react-query';
import { BiRepost } from 'react-icons/bi';
import { FaArrowLeft } from 'react-icons/fa';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { formatDateTime } from '../../utils/date';
import { useEffect, useState } from 'react';
import PostSkeleton from '../skeletons/PostSkeleton';
import CommentSkeleton from '../skeletons/CommentSkeleton';

import usePostMutations from '../../hooks/usePostMutations';

import RenderSubComments from './RenderSubComments';
import CreateCommentForm from './CreateCommentForm';
import ListFunction from './PostCommon/ListFunction';

import QuotePost from './QuotePost';
import RenderImg from './RenderImg/RenderImg';
import PostFunctions from './PostFunctions';

const SinglePost = () => {
  const { data: authUser } = useQuery({
    queryKey: ['authUser'],
  });

  const isQuote = true;

  const { username, postId } = useParams();
  // Fetch post data
  const { data: post, isLoading: isPostLoading } = useQuery({
    queryKey: ['post', postId],
    queryFn: async () => {
      const res = await fetch(`/api/posts/${username}/status/${postId}`);
      const data = await res.json();
      console.log(data);
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      return data;
    },
  });

  const isMyPost = authUser._id === post?.user._id;

  const [isRepostedByAuthUser, setIsRepostedByAuthUser] = useState(false);
  const isAuthUserRepost = post?.user._id === authUser._id;

  console.log(post);

  const isOriginalPost = post?.repost?.originalPost == null;
  useEffect(() => {
    if (authUser) {
      // 查找源帖子 ID（如果是转发的帖子）
      const originalPostId = post?.repost?.originalPost || post?._id;

      // 检查当前用户是否在转发列表中
      const isReposted = authUser.repostedPosts.includes(originalPostId);
      setIsRepostedByAuthUser(isReposted);
    } else {
      setIsRepostedByAuthUser(false); // 如果没有 authUser, 默认设置为 false
    }
  }, [authUser, post]);

  // Fetch comments data
  const { data: comments, isLoading: isCommentsLoading } = useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      const res = await fetch(
        `/api/comments/${username}/status/${postId}/comments`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      return data;
    },
  });
  const navigate = useNavigate();
  const { deletePost, isDeleting } = usePostMutations(postId);

  const highlightMentions = (text) => {
    const regex = /@\w+/g; // Regex to find mentions in the text
    return text.split(regex).map((part, index) => {
      const match = text.match(regex)?.[index];
      console.log(match);
      const username = match?.substring(1);
      console.log(username);
      if (match) {
        return (
          <>
            <span>
              {part}
              <Link key={index} to={`/profile/${username}`}>
                <span className='mention-highlight text-sky-500 hover:underline hover:text-sky-700'>
                  {match}
                </span>
              </Link>
            </span>
          </>
        );
      }
      return part;
    });
  };

  const formattedDate = post ? formatDateTime(post.createdAt) : '';

  const handleModalImgClick = (index) => {
    document.getElementById(`my_modal_${index}`).showModal();
  };

  const handlePostDeleteClick = (id) => {
    if (isDeleting) return;
    deletePost(id);
    navigate('/');
  };

  return (
    <div className='flex-[4_4_0] border-r border-gray-200 dark:border-gray-700 min-h-screen w-full'>
      <div className='flex flex-col '>
        <div className='sticky top-0   z-10 w-full   backdrop-blur-2xl px-4 py-2 '>
          <div className='flex gap-10  py-1 items-center'>
            <Link to='/'>
              <FaArrowLeft className='w-4 h-4' />
            </Link>
            <div className='flex flex-col'>
              <p className='font-bold text-lg'>Post</p>
            </div>
          </div>
        </div>
        {!isOriginalPost && !isAuthUserRepost && (
          <span className='px-14 flex text-slate-500 text-xs font-bold mt-2'>
            {' '}
            <BiRepost className='w-4 h-4  text-slate-500' />
            {post.user.username} reposted
          </span>
        )}

        {!isOriginalPost && isAuthUserRepost && (
          <span className='px-14 flex text-slate-500 text-xs font-bold mt-2'>
            {' '}
            <BiRepost className='w-4 h-4  text-slate-500' />
            You reposted
          </span>
        )}

        <div className='flex gap-2 items-start py-2 px-4 border-b border-gray-200 dark:border-gray-700 justify-center'>
          {isPostLoading && <PostSkeleton />}
          {!isPostLoading && !post && (
            <p className='text-center text-lg mt-4'>Post not found</p>
          )}

          {!isPostLoading && post && (
            <div className='flex flex-col flex-1'>
              <div className='flex flex-row gap-2 items-center justify-between'>
                <div className='flex  gap-4'>
                  <div className='avatar'>
                    {/* Avatar */}
                    {isOriginalPost && (
                      <Link
                        to={`/profile/${post.user.username}`}
                        className='w-12 h-12 rounded-full overflow-hidden'>
                        <img
                          src={
                            post.user.profileImg || '/avatar-placeholder.png'
                          }
                          alt={`${post.user.profileImg}'s avatar`}
                        />
                      </Link>
                    )}
                    {!isOriginalPost && (
                      <Link
                        to={`/profile/${post.repost.postOwner?.username}`}
                        className='w-12 h-12 rounded-full overflow-hidden'>
                        <img
                          src={
                            post.repost.postOwner?.profileImg ||
                            '/avatar-placeholder.png'
                          }
                        />
                      </Link>
                    )}
                  </div>
                  <div className='flex flex-col justify-start'>
                    {/* fullName */}
                    {isOriginalPost && (
                      <Link
                        to={`/profile/${post.user.username}`}
                        className='font-bold'>
                        {post.user.fullName}
                      </Link>
                    )}
                    {!isOriginalPost && (
                      <Link
                        to={`/profile/${post.repost.postOwner.username}`}
                        className='font-bold'>
                        {post.repost.postOwner.fullName}
                      </Link>
                    )}

                    <span className='text-gray-500 flex gap-1 text-sm'>
                      <Link
                        to={`/profile/${
                          isOriginalPost
                            ? post.user.username
                            : post.repost.postOwner.username
                        }`}>
                        @
                        {isOriginalPost
                          ? post.user.username
                          : post.repost.postOwner.username}
                      </Link>
                    </span>
                  </div>
                </div>

                <div className=' flex justify-end items-center'>
                  <ListFunction
                    postId={postId}
                    isMyPost={isMyPost}
                    isAuthUserRepost={isAuthUserRepost}
                    postUser={post?.user}
                    authUser={authUser}
                    isOriginalPost={isOriginalPost}
                    onPostDeleteClick={() => handlePostDeleteClick(post._id)}
                  />
                </div>
              </div>
              <div className='flex flex-col gap-3 overflow-hidden mt-2'>
                {isOriginalPost && (
                  <span className='text-lg whitespace-pre-wrap word-wrap'>
                    {highlightMentions(post.text)}
                  </span>
                )}
                {!isOriginalPost && (
                  <span className='text-lg whitespace-pre-wrap word-wrap'>
                    {highlightMentions(post.repost.originalText)}
                  </span>
                )}

                {isOriginalPost && post.imgs.length > 0 && (
                  <RenderImg
                    imgs={post.imgs}
                    onImgClick={handleModalImgClick}
                  />
                )}

                {!isOriginalPost && post.repost.originalImgs?.length > 0 && (
                  <RenderImg
                    imgs={post.repost.originalImgs}
                    onImgClick={handleModalImgClick}
                  />
                )}
                {!isQuote && (
                  <QuotePost post={post} isOriginalPost={isOriginalPost} />
                )}
              </div>
              <div className='text-sm mt-2 text-gray-500 flex gap-1'>
                {formattedDate} From
                {post?.postLocation ? post?.postLocation : 'Earth'}
              </div>
            </div>
          )}
        </div>
        <div className='flex flex-col justify-between my-1 px-5 md:px-14 border-b border-gray-200 dark:border-gray-700 py-2    '>
          <PostFunctions
            post={post}
            comments={comments}
            isRepostedByAuthUser={isRepostedByAuthUser}
            size={'lg'}
          />
        </div>

        {/* CREATE COMMENT */}

        <CreateCommentForm
          post={post}
          authUser={authUser}
          type={'ReplyToPost'}
        />
        {/* POST COMMENT */}
        <div className=''>
          {isCommentsLoading ? (
            <>
              <CommentSkeleton />
              <CommentSkeleton />
            </>
          ) : (
            comments.map((comment) => {
              return (
                <div
                  key={comment?._id}
                  className='border-b border-gray-200 dark:border-gray-700  pt-2'>
                  <RenderSubComments postComment={comment} pageType={1} />
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default SinglePost;
