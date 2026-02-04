import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AIReflection {
  id: string;
  user_input: string;
  quote: string;
  explanation: string;
  created_at: string;
}

export interface DailyReflection {
  id: string;
  quote: string;
  explanation: string;
  date: string;
  created_at: string;
}

export function useReflections() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [reflections, setReflections] = useState<AIReflection[]>([]);
  const [dailyReflection, setDailyReflection] = useState<DailyReflection | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const getSessionId = () => {
    let sessionId = localStorage.getItem('manomaya_session');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem('manomaya_session', sessionId);
    }
    return sessionId;
  };

  const generateReflection = useCallback(async (userInput: string): Promise<AIReflection | null> => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-reflection', {
        body: { userInput, sessionId: getSessionId() },
      });

      if (error) throw error;
      
      const reflection: AIReflection = {
        id: data.id,
        user_input: data.userInput,
        quote: data.quote,
        explanation: data.explanation,
        created_at: data.created_at,
      };

      setReflections(prev => [reflection, ...prev]);
      return reflection;
    } catch (error) {
      console.error('Error generating reflection:', error);
      toast({
        title: 'Unable to generate reflection',
        description: 'Please try again in a moment.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [toast]);

  const fetchReflections = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('ai_reflections')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setReflections(data || []);
    } catch (error) {
      console.error('Error fetching reflections:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchDailyReflection = useCallback(async () => {
    try {
      // First check if we have today's reflection in the database
      const today = new Date().toISOString().split('T')[0];
      const { data: existing } = await supabase
        .from('daily_reflections')
        .select('*')
        .eq('date', today)
        .single();

      if (existing) {
        setDailyReflection(existing);
        return existing;
      }

      // If not, call the edge function to generate one
      const { data, error } = await supabase.functions.invoke('generate-daily-reflection');
      
      if (error) throw error;
      setDailyReflection(data);
      return data;
    } catch (error) {
      console.error('Error fetching daily reflection:', error);
      return null;
    }
  }, []);

  return {
    isGenerating,
    isLoading,
    reflections,
    dailyReflection,
    generateReflection,
    fetchReflections,
    fetchDailyReflection,
  };
}
