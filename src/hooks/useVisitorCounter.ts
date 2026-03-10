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
          // Increment via raw update
          const { data: current } = await supabase
            .from('visitor_counter')
            .select('count')
            .eq('id', 1)
            .maybeSingle();

          if (current) {
            const newCount = (current.count as number) + 1;
            await supabase
              .from('visitor_counter')
              .update({ count: newCount, updated_at: new Date().toISOString() })
              .eq('id', 1);
            setCount(newCount);
            sessionStorage.setItem(SESSION_KEY, 'true');
          }
        } else {
          // Just read
          const { data } = await supabase
            .from('visitor_counter')
            .select('count')
            .eq('id', 1)
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
