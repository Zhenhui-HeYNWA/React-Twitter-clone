import { useQuery } from '@tanstack/react-query';

import { Link, useNavigate, useParams } from 'react-router-dom';
import { formatDateTime } from '../../utils/date';
import { useEffect, useState } from 'react';
import PostSkeleton from '../skeletons/PostSkeleton';
import CommentSkeleton from '../skeletons/CommentSkeleton';

import usePostMutations from '../../hooks/usePostMutations';

import RenderSubComments from './RenderSubComments';

import ListFunction from './PostCommon/ListFunction';

import QuotePost from './QuotePost';
import RenderImg from './RenderImg/RenderImg';
import PostFunctions from './PostFunctions';

import PostHeader from './PostCommon/PostHeader';
import RenderText from './PostCommon/RenderText';
import PostAuthorDetail from './PostCommon/PostAuthorDetail';
import CreateCommentForm from './Comments/CreateCommentForm';

const SinglePost = () => {
  const { data: authUser } = useQuery({
    queryKey: ['authUser'],
  });

  const { username, postId } = useParams();

  // Fetch post data
  const { data: post, isLoading: isPostLoading } = useQuery({
    queryKey: ['post', postId],
    queryFn: async () => {
      const res = await fetch(`/api/posts/${username}/status/${postId}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      return data;
    },
  });

  const isQuote = !!(
    post?.quote &&
    post?.quote.originalPost &&
    post?.quote.originalUser
  );

  const isMyPost = authUser._id === post?.user._id;

  const [isRepostedByAuthUser, setIsRepostedByAuthUser] = useState(false);

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
  // 确保 username 和 postId 存在后再进行查询

  const { data: comments, isLoading: isCommentsLoading } = useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      const url = `/api/comments/${username}/status/${postId}/comments`;

      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      return data;
    },
    enabled: !!postId, // 只有在 postId 存在时才执行查询
  });
  const navigate = useNavigate();
  const { deletePost, isDeleting } = usePostMutations(postId);

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
        <PostHeader post={post} authUser={authUser} />

        <div className='flex gap-2 items-start py-2 px-4 border-b border-gray-200 dark:border-gray-700 justify-center'>
          {isPostLoading && <PostSkeleton />}
          {!isPostLoading && !post && (
            <p className='text-center text-lg mt-4'>Post not found</p>
          )}

          {!isPostLoading && post && (
            <div className='flex flex-col flex-1'>
              <div className='flex flex-row gap-2 items-center justify-between'>
                <div className='flex  gap-4 w-full'>
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

                  <div className='flex w-full justify-between'>
                    {isOriginalPost ? (
                      <PostAuthorDetail postUser={post?.user} />
                    ) : (
                      <PostAuthorDetail postUser={post.repost.postOwner} />
                    )}
                    <div className='list-function-drop'>
                      <ListFunction
                        id={postId}
                        isBelongsToAuthUser={isMyPost}
                        owner={post?.user}
                        authUser={authUser}
                        isOriginal={isOriginalPost}
                        onDeleteClick={() => handlePostDeleteClick(post._id)}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className='flex flex-col gap-3  mt-2 '>
                {isOriginalPost && post.text && (
                  <span className='text-lg whitespace-pre-wrap word-wrap '>
                    <RenderText text={post.text} />
                  </span>
                )}
                {!isOriginalPost && (
                  <span className='text-lg whitespace-pre-wrap word-wrap'>
                    <RenderText text={post.repost.originalText} />
                  </span>
                )}
                <div className='rounded-xl overflow-hidden w-fit'>
                  {isOriginalPost && post.imgs.length > 0 && (
                    <RenderImg
                      imgs={post.imgs}
                      onImgClick={handleModalImgClick}
                      size='lg'
                    />
                  )}

                  {!isOriginalPost && post.repost.originalImgs?.length > 0 && (
                    <RenderImg
                      imgs={post.repost.originalImgs}
                      onImgClick={handleModalImgClick}
                      size='lg'
                    />
                  )}
                </div>
                {isQuote && (
                  <QuotePost post={post} isOriginalPost={isOriginalPost} />
                )}
              </div>
              <div className='text-sm mt-2 text-gray-500 flex gap-1'>
                {formattedDate} From
                <span></span>
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
            postId={postId}
            username={username}
          />
        </div>

        {/* CREATE COMMENT */}

        <CreateCommentForm
          post={post}
          authUser={authUser}
          type={'ReplyToPost'}
          buttonType={'Reply'}
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
