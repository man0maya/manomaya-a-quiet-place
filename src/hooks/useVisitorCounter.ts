import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useVisitorCounter() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const SESSION_KEY = 'manomaya_visited';
    const alreadyCounted = sessionStorage.getItem(SESSION_KEY);

    const run = async () => {
      try {
        if (!alreadyCounted) {
          // Atomic, server-side increment via SECURITY DEFINER function
          const { data, error } = await supabase.rpc('increment_visitor_counter');
          if (!error && data !== null && data !== undefined) {
            setCount(data as number);
            sessionStorage.setItem(SESSION_KEY, 'true');
          }
        } else {
          const { data } = await supabase
            .from('visitor_counter')
            .select('count')
            .limit(1)
            .maybeSingle();
          if (data) setCount(data.count as number);
        }
      } catch (err) {
        console.error('Visitor counter error:', err);
      }
    };

    run();
  }, []);

  return count;
}
