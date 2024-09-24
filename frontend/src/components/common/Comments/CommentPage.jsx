import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { Link, useNavigate, useParams } from 'react-router-dom';

import PostSkeleton from '../../skeletons/PostSkeleton';

import CommentSkeleton from '../../skeletons/CommentSkeleton';

import RenderSubComments from '../RenderSubComments';
import SingleCommentSkeleton from '../../skeletons/SingleCommentSkeleton';

import CreateCommentForm from '../Comments/CreateCommentForm';

import RenderComments from '../RenderComments';

import PostFunctions from '../PostFunctions';
import ListFunction from '../PostCommon/ListFunction';
import RenderImg from '../RenderImg/RenderImg';
import RenderText from '../PostCommon/RenderText';
import PostHeader from '../PostCommon/PostHeader';
import PostAuthorDetail from '../PostCommon/PostAuthorDetail';
import usePostMutations from '../../../hooks/usePostMutations';

const CommentPage = () => {
  const { data: authUser } = useQuery({
    queryKey: ['authUser'],
  });

  const [isRepostedByAuthUser, setIsRepostedByAuthUser] = useState(false);

  const { username, postId, commentId } = useParams();

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

  //Post checked
  const isMyPost = authUser._id === post?.user._id;

  const isOriginalPost = post?.repost?.originalPost == null;

  const navigate = useNavigate();
  const { data: postComment, isLoading: isPostCommentLoading } = useQuery({
    queryKey: ['comment', commentId],
    queryFn: async () => {
      const res = await fetch(
        `/api/comments/${postId}/comment/${username}/${commentId}`
      );
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      return data;
    },
  });

  useEffect(() => {
    if (authUser) {
      // Find the original post ID (if it's a repost)
      const originalPostId = post?.repost?.originalPost || post?._id;

      // Check if the current user is in the list of users who reposted this post
      const isReposted = authUser.repostedPosts.includes(originalPostId);
      setIsRepostedByAuthUser(isReposted);
    } else {
      setIsRepostedByAuthUser(false); // If there's no authenticated user, set the repost status to false by default
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
  const getUniqueCommentUsernames = (arr) => [...new Set(arr)];

  const CommentUsername = getUniqueCommentUsernames(
    [...(comments?.map((comment) => comment?.user?.username) || [])].filter(
      Boolean
    )
  );

  const { deletePost, isDeleting } = usePostMutations(postId);

  const handleModalImgClick = (index) => {
    document.getElementById(`my_modal_${index}`).showModal();
  };

  //Post:Delete
  const handlePostDeleteClick = (id) => {
    if (isDeleting) return;
    deletePost(id);
    navigate('/');
  };

  return (
    <div className='flex-[4_4_0] border-r border-gray-200 dark:border-gray-700 min-h-screen  w-full '>
      <PostHeader post={post} authUser={authUser} />
      <div className='flex flex-col  '>
        <div className=''>
          {/* Post Sections */}
          <div className='post  hover:bg-slate-200   dark:hover:bg-inherit '>
            <div className='  flex flex-col w-full items-start pt-1 px-4 justify-center  '>
              {isPostLoading && <PostSkeleton />}
              {!isPostLoading && !post && (
                <p className='text-center text-lg mt-4'>Post not found</p>
              )}

              {!isPostLoading && post && (
                <div className='flex flex-col w-full'>
                  <div className='flex flex-col gap-1 items-center justify-between  '>
                    <div className='flex  gap-4  w-full '>
                      <div className=' flex flex-col items-center '>
                        <div className='avatar'>
                          {/* Avatar */}
                          {isOriginalPost && (
                            <Link
                              to={`/profile/${post.user.username}`}
                              className='w-12 h-12 rounded-full overflow-hidden'>
                              <img
                                src={
                                  post.user.profileImg ||
                                  '/avatar-placeholder.png'
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
                        <div className='w-0.5 dark:bg-slate-700  bg-gray-400  h-full mt-1'></div>
                      </div>

                      <div className='flex flex-col  w-full gap-1  '>
                        <div className='flex  items-center justify-between  w-full '>
                          {isOriginalPost ? (
                            <PostAuthorDetail
                              postUser={post.user}
                              date={post.createdAt}
                              type={'main'}
                            />
                          ) : (
                            <PostAuthorDetail
                              postUser={post.repost.postOwner}
                              date={post.createdAt}
                              type={'main'}
                            />
                          )}

                          <div className=' flex justify-end items-center'>
                            <ListFunction
                              id={postId}
                              isBelongsToAuthUser={isMyPost}
                              owner={post?.user}
                              authUser={authUser}
                              isOriginal={isOriginalPost}
                              onDeleteClick={() =>
                                handlePostDeleteClick(post._id)
                              }
                            />
                          </div>
                        </div>
                        {/* post text */}
                        <div className='flex flex-col overflow-hidden  '>
                          {isOriginalPost && (
                            <span className='text-lg whitespace-pre-wrap word-wrap '>
                              <RenderText text={post.text} />
                            </span>
                          )}
                          {!isOriginalPost && (
                            <span className='text-lg whitespace-pre-wrap word-wrap '>
                              <RenderText text={post.repost.originalText} />
                            </span>
                          )}
                          {isOriginalPost && post.imgs.length > 0 && (
                            <div className='rounded-xl overflow-hidden w-fit mb-3'>
                              <RenderImg
                                imgs={post.imgs}
                                onImgClick={handleModalImgClick}
                                size='lg'
                              />
                            </div>
                          )}

                          {!isOriginalPost &&
                            post.repost.originalImgs.length > 0 && (
                              <div className='rounded-xl overflow-hidden w-fit mb-3'>
                                <RenderImg
                                  imgs={post.repost.originalImgs}
                                  onImgClick={handleModalImgClick}
                                  size='lg'
                                />
                              </div>
                            )}
                        </div>
                        {/* post functions */}
                        <PostFunctions
                          post={post}
                          comments={comments}
                          isRepostedByAuthUser={isRepostedByAuthUser}
                          isOriginalPost={isOriginalPost}
                          username={username}
                          postId={postId}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/*  */}

          <div className='px-4'>
            {/* Comment section */}
            {isPostCommentLoading ? (
              <>
                <SingleCommentSkeleton />
                <CommentSkeleton />
              </>
            ) : (
              <RenderComments
                post={post}
                comment={postComment}
                isLoading={isCommentsLoading}
              />
            )}
          </div>
        </div>

        {/* CREATE COMMENT */}

        <CreateCommentForm
          comment={postComment}
          CommentUsername={CommentUsername}
          authUser={authUser}
          type={'replyToComment'}
          commentId={commentId}
          buttonType={'Reply'}
        />

        {/* SubComment sections */}
        {/* POST COMMENT */}
        {isCommentsLoading && (
          <>
            <CommentSkeleton />
            <CommentSkeleton />
            <CommentSkeleton />
          </>
        )}

        {!isCommentsLoading &&
          postComment?.replies.map((reply) => {
            return (
              <div
                key={reply._id}
                className=' border-b  border-gray-200 dark:border-gray-700 hover:bg-slate-200 dark:hover:bg-inherit'>
                <RenderSubComments postComment={reply} pageType={'comment'} />
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default CommentPage;
