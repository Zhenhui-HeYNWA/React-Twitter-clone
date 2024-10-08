import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
const useCommentMutations = () => {
  const queryClient = useQueryClient();

  const { mutate: replyComment, isPending: isReplying } = useMutation({
    mutationFn: async ({ commentId, text, imgs }) => {
      try {
        const res = await fetch(`/api/comments/comment/${commentId}/reply`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text, imgs }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Something went wrong');
        return data;
      } catch (error) {
        throw new Error(error);
      }
    },

    onSuccess: () => {
      toast.success('Reply comment successfully');
      queryClient.invalidateQueries(['comment']);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const { mutate: deleteComment, isPending: isCommentDeleting } = useMutation({
    mutationFn: async ({ commentId }) => {
      try {
        const res = await fetch(`/api/comments/${commentId}`, {
          method: 'DELETE',
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to delete comment');
        }

        return data;
      } catch (error) {
        throw new Error(error.message || 'Something went wrong');
      }
    },
    onSuccess: () => {
      toast.success('Comment deleted successfully');
      // 使评论列表无效，从而触发重新获取数据
      queryClient.invalidateQueries(['comments']);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete comment');
    },
  });

  const { mutate: repostComment, isPending: isReposting } = useMutation({
    mutationFn: async ({ commentId, actionType, onModel }) => {
      console.log(onModel);

      try {
        const res = await fetch(`/api/posts/repost/${onModel}/${commentId}`, {
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
    onSuccess: ({ commentId, actionType }) => {
      toast.success(`Post ${actionType} successfully`);

      // Update authUser's repostedPosts
      queryClient.setQueryData(['authUser'], (oldData) => {
        if (!oldData) return oldData;

        const updatedRepostedPosts =
          actionType === 'repost'
            ? [...oldData.repostedPosts, commentId] // Add repost
            : oldData.repostedPosts.filter((id) => id !== commentId); // Remove repost

        return {
          ...oldData,
          repostedPosts: updatedRepostedPosts,
        };
      });

      // Refresh post and authUser data
      queryClient.invalidateQueries(['post', commentId]);
      queryClient.invalidateQueries(['authUser']);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const {
    mutate: quoteComment,
    isPending: isQuoting,
    isError,
    error,
  } = useMutation({
    mutationFn: async ({ text, imgs, locationName, onModel, commentId }) => {
      try {
        const res = await fetch(`/api/posts/quote/${onModel}/${commentId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text, imgs, locationName }),
        });
        console.log(commentId);

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Something went wrong');
        return data;
      } catch (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: (commentId) => {
      toast.success('Quote post successfully');
      queryClient.setQueryData(['authUser'], (oldData) => {
        if (!oldData) return oldData;

        const updatedRepostedPosts = [...oldData.repostedPosts, commentId]; // Add repost

        return {
          ...oldData,
          repostedPosts: updatedRepostedPosts,
        };
      });

      // Refresh post and authUser data
      queryClient.invalidateQueries(['comment', commentId]);
      queryClient.invalidateQueries(['authUser']);
    },
  });

  const { mutate: likeUnlikeComment, isPending: isLiking } = useMutation({
    mutationFn: async (commentId) => {
      try {
        const res = await fetch(`/api/comments/likes/${commentId}`, {
          method: 'POST',
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to like comment');
        return data;
      } catch (error) {
        throw new Error(error.message || 'Something went wrong');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['comment']);
    },
  });

  const { mutate: bookmarkComment, isPending: isMarking } = useMutation({
    mutationFn: async (commentId) => {
      try {
        const res = await fetch(`/api/comments/bookmarks/${commentId}`, {
          method: 'POST',
        });
        const data = await res.json();
        if (!res.ok)
          throw new Error(data.error || 'Failed to bookmarked comment');
        return data;
      } catch (error) {
        throw new Error(error.message || 'Something went wrong');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['comment']);
    },
  });
  return {
    replyComment,
    isReplying,
    deleteComment,
    isCommentDeleting,
    repostComment,
    isReposting,
    quoteComment,
    isQuoting,
    isError,
    error,
    likeUnlikeComment,

    isLiking,
    bookmarkComment,
    isMarking,
  };
};

export default useCommentMutations;
