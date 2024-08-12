import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

const usePostMutations = (postId) => {
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
    onSuccess: ({ data, actionType }) => {
      toast.success(`Post ${actionType} successfully`);
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
        return data;
      } catch (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: (updatedLikes) => {
      // Update the 'posts' query data
      queryClient.setQueryData(['posts'], (oldData) => {
        if (oldData) {
          return oldData.map((p) => {
            if (p._id === postId) {
              return { ...p, likes: updatedLikes };
            }
            return p;
          });
        } else {
          // Handle the case when oldData is undefined
          return [];
        }
      });

      // Update the specific 'post' query data
      queryClient.setQueryData(['post', postId], (oldPost) => {
        if (oldPost) {
          return { ...oldPost, likes: updatedLikes };
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
        return data;
      } catch (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: (updatedBookmarks) => {
      // Update the 'posts' query data
      queryClient.setQueryData(['posts'], (oldData) => {
        if (oldData) {
          return oldData.map((p) => {
            if (p._id === postId) {
              return { ...p, bookmarks: updatedBookmarks };
            }
            return p;
          });
        } else {
          // Handle the case when oldData is undefined
          return [];
        }
      });

      // Update the specific 'post' query data
      queryClient.setQueryData(['post', postId], (oldPost) => {
        if (oldPost) {
          return { ...oldPost, bookmarks: updatedBookmarks };
        }
        return oldPost;
      });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const { mutate: commentPostSimple, isPending: isCommenting } = useMutation({
    mutationFn: async ({ text }) => {
      const res = await fetch(`/api/comments/comment/${postId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
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

  // TODO: fix refetch
  const { mutate: commentPostAdvanced, isPending: isPostCommenting } =
    useMutation({
      mutationFn: async ({ postId, text }) => {
        try {
          const res = await fetch(`/api/comments/comment/${postId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text }),
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Something went wrong');
          return { comment: data, postId };
        } catch (error) {
          throw new Error(error.message);
        }
      },
      onSuccess: ({ comment, postId }) => {
        toast.success('Comment posted successfully');

        // 更新缓存中的评论数据，而不是整个帖子
        queryClient.setQueryData(['posts'], (oldData) => {
          return oldData.map((post) => {
            if (post._id === postId) {
              // 只更新 comments 部分
              return { ...post, comments: [...post.comments, comment] };
            }
            return post;
          });
        });
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });

  const { mutate: repostPost, isPending: isReposting } = useMutation({
    mutationFn: async ({ actionType }) => {
      try {
        const res = await fetch(`/api/posts/repost/${postId}`, {
          method: 'POST',
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

      // Ensure that the queryKey is consistent with the one used in useQuery
      queryClient.invalidateQueries(['post', postId]); // Invalidate post query
    },
    onError: (error) => {
      toast.error(error.message);
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
  };
};

export default usePostMutations;
