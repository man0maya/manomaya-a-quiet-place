import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useGeneratedStories() {
  return useQuery({
    queryKey: ['generated-stories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('generated_stories')
        .select('*')
        .limit(20);
      
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function usePublicReflections() {
  return useQuery({
    queryKey: ['public-reflections'],
    queryFn: async () => {
      // Use RPC for reflections to avoid 403 Forbidden security policy
      const { data, error } = await supabase.rpc('get_public_reflections', { _limit: 30 });
      
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}
