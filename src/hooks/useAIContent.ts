import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface GeneratedQuote {
  text: string;
  author: string;
}

export interface GeneratedStory {
  title: string;
  excerpt: string;
  content: string;
  date: string;
  readTime: string;
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

  return {
    generateQuote,
    generateStory,
    isGeneratingQuote,
    isGeneratingStory,
  };
}
