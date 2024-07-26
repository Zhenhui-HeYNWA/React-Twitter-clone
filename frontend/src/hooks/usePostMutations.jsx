import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

const usePostMutations = (postId) => {
  const queryClient = useQueryClient();

  const deletePost = useMutation({
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
    onSuccess: () => {
      toast.success('Post deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const likePost = useMutation({
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
      queryClient.setQueryData(['posts'], (oldData) => {
        return oldData.map((p) => {
          if (p._id === postId) {
            return { ...p, likes: updatedLikes };
          }
          return p;
        });
      });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const bookmarkPost = useMutation({
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
      queryClient.setQueryData(['posts'], (oldData) => {
        return oldData.map((p) => {
          if (p._id === postId) {
            return { ...p, bookmarks: updatedBookmarks };
          }
          return p;
        });
      });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const commentPostSimple = useMutation({
    mutationFn: async ({ text }) => {
      const res = await fetch(`/api/posts/comment/${postId}`, {
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

  const commentPostAdvanced = useMutation({
    mutationFn: async ({ text }) => {
      try {
        const res = await fetch(`/api/posts/comment/${postId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text }),
        });

        const data = await res.json();
        console.log(data);
        if (!res.ok) throw new Error(data.error || 'Something went wrong');
        return { comments: data, postId };
      } catch (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: ({ updateComments, postId }) => {
      toast.success('Comment posted successfully');
      queryClient.setQueryData(['posts'], (oldData) => {
        return oldData.map((p) => {
          if (p._id === postId) {
            return { ...p, comments: updateComments };
          }
          return p;
        });
      });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return {
    deletePost,
    likePost,
    bookmarkPost,
    commentPostSimple,
    commentPostAdvanced,
  };
};

export default usePostMutations;
