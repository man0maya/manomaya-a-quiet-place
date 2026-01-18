import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Story {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  image_url: string | null;
  video_url: string | null;
  is_active: boolean;
  display_order: number;
  read_time: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface StoryInput {
  title: string;
  content: string;
  excerpt?: string;
  image_url?: string;
  video_url?: string;
  is_active?: boolean;
  display_order?: number;
  read_time?: string;
}

export function useAdminStories() {
  const queryClient = useQueryClient();

  const storiesQuery = useQuery({
    queryKey: ['admin-stories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data as Story[];
    },
  });

  const createStory = useMutation({
    mutationFn: async (input: StoryInput) => {
      const { data: user } = await supabase.auth.getUser();
      
      // Get max display_order
      const { data: maxOrder } = await supabase
        .from('stories')
        .select('display_order')
        .order('display_order', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      const nextOrder = (maxOrder?.display_order ?? -1) + 1;
      
      const { data, error } = await supabase
        .from('stories')
        .insert({
          ...input,
          display_order: input.display_order ?? nextOrder,
          created_by: user?.user?.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-stories'] });
      toast.success('Story created successfully');
    },
    onError: (error) => {
      toast.error(`Failed to create story: ${error.message}`);
    },
  });

  const updateStory = useMutation({
    mutationFn: async ({ id, ...input }: StoryInput & { id: string }) => {
      const { data, error } = await supabase
        .from('stories')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-stories'] });
      toast.success('Story updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update story: ${error.message}`);
    },
  });

  const deleteStory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('stories')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-stories'] });
      toast.success('Story deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete story: ${error.message}`);
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('stories')
        .update({ is_active })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-stories'] });
      toast.success('Story status updated');
    },
    onError: (error) => {
      toast.error(`Failed to update status: ${error.message}`);
    },
  });

  const reorderStories = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const updates = orderedIds.map((id, index) => 
        supabase
          .from('stories')
          .update({ display_order: index })
          .eq('id', id)
      );
      
      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-stories'] });
      toast.success('Order updated');
    },
    onError: (error) => {
      toast.error(`Failed to reorder: ${error.message}`);
    },
  });

  return {
    stories: storiesQuery.data ?? [],
    isLoading: storiesQuery.isLoading,
    error: storiesQuery.error,
    createStory,
    updateStory,
    deleteStory,
    toggleActive,
    reorderStories,
  };
}
