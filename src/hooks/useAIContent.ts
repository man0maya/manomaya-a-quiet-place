import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface GeneratedQuote {
  id?: string;
  text: string;
  author: string;
  created_at?: string;
}

export interface GeneratedStory {
  id?: string;
  title: string;
  excerpt: string;
  content: string;
  read_time?: string;
  readTime?: string;
  created_at?: string;
}

export function useAIContent() {
  const [isGeneratingQuote, setIsGeneratingQuote] = useState(false);
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);

  const generateQuote = useCallback(async (): Promise<GeneratedQuote | null> => {
    setIsGeneratingQuote(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: { type: 'quote' }
      });

      if (error) {
        console.error('Error generating quote:', error);
        toast.error('Failed to generate quote. Please try again.');
        return null;
      }

      return data.content as GeneratedQuote;
    } catch (err) {
      console.error('Error:', err);
      toast.error('Something went wrong. Please try again.');
      return null;
    } finally {
      setIsGeneratingQuote(false);
    }
  }, []);

  const generateStory = useCallback(async (): Promise<GeneratedStory | null> => {
    setIsGeneratingStory(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: { type: 'story' }
      });

      if (error) {
        console.error('Error generating story:', error);
        toast.error('Failed to generate story. Please try again.');
        return null;
      }

      return data.content as GeneratedStory;
    } catch (err) {
      console.error('Error:', err);
      toast.error('Something went wrong. Please try again.');
      return null;
    } finally {
      setIsGeneratingStory(false);
    }
  }, []);

  const fetchSavedQuotes = useCallback(async (): Promise<GeneratedQuote[]> => {
    const { data, error } = await supabase
      .from('generated_quotes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching quotes:', error);
      return [];
    }

    return data || [];
  }, []);

  const fetchSavedStories = useCallback(async (): Promise<GeneratedStory[]> => {
    const { data, error } = await supabase
      .from('generated_stories')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching stories:', error);
      return [];
    }

    return data || [];
  }, []);

  return {
    generateQuote,
    generateStory,
    fetchSavedQuotes,
    fetchSavedStories,
    isGeneratingQuote,
    isGeneratingStory,
  };
}
