import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

const usePostMutations = (postId, feedType, username) => {
  const queryClient = useQueryClient();

  const { mutate: deletePost, isPending: isDeleting } = useMutation({
    mutationFn: async () => {
      try {
        const res = await fetch(`/api/posts/${postId}`, {
          method: 'DELETE',
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Something went wrong');
        return data;
      } catch (error) {
        throw new Error(error);
      }
    },
    onSuccess: ({ data }) => {
      toast.success(`Post delete successfully`);
      queryClient.setQueryData(['post', postId], data); // Directly update post data
      queryClient.invalidateQueries(['posts']);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const { mutate: likePost, isPending: isLiking } = useMutation({
    mutationFn: async () => {
      try {
        const res = await fetch(`/api/posts/like/${postId}`, {
          method: 'POST',
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Something went wrong');
        return data.likes; // Ensure you return only the likes array
      } catch (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: (updatedLikes) => {
      toast.success('Liked Post!');

      // Update the 'posts' query data
      queryClient.setQueryData(['posts', feedType, username], (oldData) => {
        console.log(feedType);

        // Debugging line
        if (oldData) {
          return oldData.map((p) => {
            if (p._id === postId) {
              return { ...p, likes: updatedLikes }; // Ensure likes is an array
            }
            return p;
          });
        } else {
          return [];
        }
      });
      // Update the specific 'post' query data
      queryClient.setQueryData(['post', postId], (oldPost) => {
        if (oldPost) {
          return { ...oldPost, likes: updatedLikes || [] }; // Ensure likes is an array
        }
        return oldPost;
      });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const { mutate: bookmarkPost, isPending: isBookmarking } = useMutation({
    mutationFn: async () => {
      try {
        const res = await fetch(`/api/posts/bookmark/${postId}`, {
          method: 'POST',
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Something went wrong');
        return data; // This should be an array of bookmarks
      } catch (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: (updatedBookmarks) => {
      queryClient.setQueryData(['posts', feedType, username], (oldData) => {
        if (oldData) {
          return oldData.map((p) => {
            if (p._id === postId) {
              return { ...p, bookmarks: updatedBookmarks }; // Ensure this is an array
            }
            return p;
          });
        } else {
          return [];
        }
      });

      queryClient.setQueryData(['post', postId], (oldPost) => {
        if (oldPost) {
          return { ...oldPost, bookmarks: updatedBookmarks }; // Ensure this is an array
        }
        return oldPost;
      });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const { mutate: commentPostSimple, isPending: isCommenting } = useMutation({
    mutationFn: async ({ text, imgs }) => {
      const res = await fetch(`/api/comments/comment/${postId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, imgs }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      return data;
    },
    onSuccess: () => {
      toast.success('Comment posted successfully');
      queryClient.invalidateQueries(['comments', postId]);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const { mutate: commentPostAdvanced, isPending: isPostCommenting } =
    useMutation({
      mutationFn: async ({ postId, text, imgs }) => {
        try {
          const res = await fetch(`/api/comments/comment/${postId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, imgs }),
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Something went wrong');
          return { comment: data.comment, postId };
        } catch (error) {
          throw new Error(error.message);
        }
      },
      // onSuccess: () => {
      //   toast.success('Comment posted successfully');
      //   queryClient.invalidateQueries(['comments', postId]);
      // },
      onSuccess: (updateComment, { postId }) => {
        toast.success('Comment posted successfully');

        // Update the 'comments' cache directly without refetching
        queryClient.setQueryData(['comments', postId], (oldComments) => {
          if (!oldComments) return [updateComment.comment]; // First comment in array
          return [...oldComments, updateComment.comment]; // Add new comment to existing ones
        });

        // Update the 'posts' cache to reflect new comment count and comments in the post
        queryClient.setQueryData(['posts', feedType, username], (oldPosts) => {
          if (!oldPosts) return oldPosts;
          return oldPosts.map((post) => {
            if (post._id === postId) {
              const updatedComments = [...post.comments, updateComment.comment];
              return {
                ...post,
                comments: updatedComments,
                commentsCount: updatedComments.length, // 同步更新评论计数
              };
            }
            return post;
          });
        });
      },
      onError: (error) => {
        console.log(error.message);
        toast.error(error.message);
      },
    });

  const { mutate: repostPost, isPending: isReposting } = useMutation({
    mutationFn: async ({ actionType }) => {
      try {
        const res = await fetch(`/api/posts/repost/${postId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ actionType }), // Send actionType to the server
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Something went wrong');
        return { data, actionType };
      } catch (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: ({ actionType }) => {
      toast.success(`Post ${actionType} successfully`);

      // Update authUser's repostedPosts
      queryClient.setQueryData(['authUser'], (oldData) => {
        if (!oldData) return oldData;

        const updatedRepostedPosts =
          actionType === 'repost'
            ? [...oldData.repostedPosts, postId] // Add repost
            : oldData.repostedPosts.filter((id) => id !== postId); // Remove repost

        return {
          ...oldData,
          repostedPosts: updatedRepostedPosts,
        };
      });

      // Refresh post and authUser data
      queryClient.invalidateQueries(['post', postId]);
      queryClient.invalidateQueries(['authUser']);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const { mutate: pinPost, isPending: isPinning } = useMutation({
    mutationFn: async () => {
      try {
        const res = await fetch(`/api/posts/pin/${postId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Something went wrong');
        return data;
      } catch (error) {
        console.error('Error pinning post:', error.message);
        throw new Error(error.message);
      }
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Post Pinned successfully');

      queryClient.setQueryData(['authUser'], (oldData) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          pinnedPost: data.pinnedPost,
        };
      });
      if (feedType === 'posts') {
        queryClient.invalidateQueries(['authUser']);
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const {
    mutate: quotePost,
    isPending: isQuoting,
    isError,
    error,
  } = useMutation({
    mutationFn: async ({ text, imgs, locationName }) => {
      try {
        const res = await fetch(`/api/posts/quote/${postId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text, imgs, locationName }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Something went wrong');
        return data;
      } catch (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      toast.success('Quote post successfully');
      queryClient.setQueryData(['authUser'], (oldData) => {
        if (!oldData) return oldData;

        const updatedRepostedPosts = [...oldData.repostedPosts, postId]; // Add repost

        return {
          ...oldData,
          repostedPosts: updatedRepostedPosts,
        };
      });

      // Refresh post and authUser data
      queryClient.invalidateQueries(['post', postId]);
      queryClient.invalidateQueries(['authUser']);
    },
  });

  return {
    deletePost,
    isDeleting,

    likePost,
    isLiking,
    bookmarkPost,
    isBookmarking,
    commentPostSimple,
    isCommenting,
    commentPostAdvanced,
    isPostCommenting,
    repostPost,
    isReposting,
    pinPost,
    isPinning,
    quotePost,
    isQuoting,
    isError,
    error,
  };
};

export default usePostMutations;
