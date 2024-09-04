import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
const useCommentMutations = () => {
  const queryClient = useQueryClient();

  const { mutate: replyComment, isPending: isReplying } = useMutation({
    mutationFn: async ({ commentId, text }) => {
      try {
        const res = await fetch(`/api/comments/comment/${commentId}/reply`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text }),
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
      console.log(commentId);
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
    likeUnlikeComment,
    isLiking,
    bookmarkComment,
    isMarking,
  };
};

export default useCommentMutations;
