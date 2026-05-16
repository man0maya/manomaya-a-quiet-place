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

    // Fix #6: apply optimistic update then roll back on error
    if (isFavorited) {
      setFavorites(prev => {
        const next = new Set(prev);
        next.delete(contentId);
        return next;
      });
      const { error } = await supabase.rpc('remove_favorite', {
        _content_id: contentId,
        _session_id: sessionId,
      });
      if (error) {
        console.error('Error removing favorite:', error);
        // Roll back
        setFavorites(prev => new Set([...prev, contentId]));
      }
    } else {
      setFavorites(prev => new Set([...prev, contentId]));
      const { error } = await supabase
        .from('favorites')
        .insert({ content_id: contentId, content_type: contentType, session_id: sessionId });
      if (error) {
        console.error('Error adding favorite:', error);
        // Roll back
        setFavorites(prev => {
          const next = new Set(prev);
          next.delete(contentId);
          return next;
        });
      }
    }
  };

  const isFavorited = (contentId: string) => favorites.has(contentId);

  return { favorites, toggleFavorite, isFavorited, fetchFavorites };
}
