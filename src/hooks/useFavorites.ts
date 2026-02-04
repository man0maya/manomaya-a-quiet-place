import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const getSessionId = () => {
    let sessionId = localStorage.getItem('manomaya_session');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem('manomaya_session', sessionId);
    }
    return sessionId;
  };

  const fetchFavorites = useCallback(async () => {
    const sessionId = getSessionId();
    const { data } = await supabase
      .from('favorites')
      .select('content_id')
      .eq('session_id', sessionId);
    
    if (data) {
      setFavorites(new Set(data.map(f => f.content_id)));
    }
  }, []);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const toggleFavorite = async (contentId: string, contentType: 'post' | 'reflection') => {
    const sessionId = getSessionId();
    const isFavorited = favorites.has(contentId);

    if (isFavorited) {
      await supabase
        .from('favorites')
        .delete()
        .eq('content_id', contentId)
        .eq('session_id', sessionId);
      
      setFavorites(prev => {
        const next = new Set(prev);
        next.delete(contentId);
        return next;
      });
    } else {
      await supabase
        .from('favorites')
        .insert({ content_id: contentId, content_type: contentType, session_id: sessionId });
      
      setFavorites(prev => new Set([...prev, contentId]));
    }
  };

  const isFavorited = (contentId: string) => favorites.has(contentId);

  return { favorites, toggleFavorite, isFavorited, fetchFavorites };
}
