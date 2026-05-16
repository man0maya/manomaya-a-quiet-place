import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useFavorites() {
  const queryClient = useQueryClient();

  const getSessionId = () => {
    let sessionId = localStorage.getItem('manomaya_session');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem('manomaya_session', sessionId);
    }
    return sessionId;
  };

  const { data: favoritesSet = new Set<string>() } = useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      const sessionId = getSessionId();
      const { data, error } = await supabase
        .from('favorites')
        .select('content_id')
        .eq('session_id', sessionId);
      
      if (error) throw error;
      return new Set(data.map(f => f.content_id));
    },
    // Keep favorites for the session
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ contentId, contentType }: { contentId: string, contentType: 'post' | 'reflection' }) => {
      const sessionId = getSessionId();
      const isFavorited = favoritesSet.has(contentId);

      if (isFavorited) {
        const { error } = await supabase.rpc('remove_favorite', {
          _content_id: contentId,
          _session_id: sessionId,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({ content_id: contentId, content_type: contentType, session_id: sessionId });
        if (error) throw error;
      }
    },
    onMutate: async ({ contentId }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['favorites'] });
      const previousFavorites = queryClient.getQueryData<Set<string>>(['favorites']);
      
      queryClient.setQueryData(['favorites'], (old: Set<string> | undefined) => {
        const next = new Set(old || []);
        if (next.has(contentId)) {
          next.delete(contentId);
        } else {
          next.add(contentId);
        }
        return next;
      });

      return { previousFavorites };
    },
    onError: (err, variables, context) => {
      if (context?.previousFavorites) {
        queryClient.setQueryData(['favorites'], context.previousFavorites);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });

  const toggleFavorite = (contentId: string, contentType: 'post' | 'reflection') => {
    toggleMutation.mutate({ contentId, contentType });
  };

  const isFavorited = (contentId: string) => favoritesSet.has(contentId);

  return { 
    favorites: favoritesSet, 
    toggleFavorite, 
    isFavorited, 
    isLoading: toggleMutation.isPending 
  };
}

