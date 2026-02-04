import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Post {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  image_url: string | null;
  status: 'draft' | 'published' | 'scheduled';
  scheduled_for: string | null;
  display_order: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export function useAdminPosts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['admin-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Post[];
    },
  });

  const createPost = useMutation({
    mutationFn: async (post: Omit<Post, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('posts')
        .insert({
          ...post,
          created_by: user?.id,
          published_at: post.status === 'published' ? new Date().toISOString() : null,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
      queryClient.invalidateQueries({ queryKey: ['public-posts'] });
      toast({ title: 'Post created successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error creating post', description: error.message, variant: 'destructive' });
    },
  });

  const updatePost = useMutation({
    mutationFn: async (post: Partial<Post> & { id: string }) => {
      const updates: Partial<Post> = { ...post };
      if (post.status === 'published' && !post.published_at) {
        updates.published_at = new Date().toISOString();
      }
      
      const { data, error } = await supabase
        .from('posts')
        .update(updates)
        .eq('id', post.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
      queryClient.invalidateQueries({ queryKey: ['public-posts'] });
      toast({ title: 'Post updated successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error updating post', description: error.message, variant: 'destructive' });
    },
  });

  const deletePost = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('posts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
      queryClient.invalidateQueries({ queryKey: ['public-posts'] });
      toast({ title: 'Post deleted successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error deleting post', description: error.message, variant: 'destructive' });
    },
  });

  const publishPost = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'draft' | 'published' }) => {
      const updates: Partial<Post> = { status };
      if (status === 'published') {
        updates.published_at = new Date().toISOString();
      }
      
      const { error } = await supabase.from('posts').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
      queryClient.invalidateQueries({ queryKey: ['public-posts'] });
    },
  });

  return {
    posts,
    isLoading,
    createPost,
    updatePost,
    deletePost,
    publishPost,
  };
}

export function usePublicPosts() {
  return useQuery({
    queryKey: ['public-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false });
      
      if (error) throw error;
      return data as Post[];
    },
  });
}
