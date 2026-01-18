import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Quote {
  id: string;
  text: string;
  author: string;
  image_url: string | null;
  is_active: boolean;
  display_order: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuoteInput {
  text: string;
  author: string;
  image_url?: string;
  is_active?: boolean;
  display_order?: number;
}

export function useAdminQuotes() {
  const queryClient = useQueryClient();

  const quotesQuery = useQuery({
    queryKey: ['admin-quotes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data as Quote[];
    },
  });

  const createQuote = useMutation({
    mutationFn: async (input: QuoteInput) => {
      const { data: user } = await supabase.auth.getUser();
      
      // Get max display_order
      const { data: maxOrder } = await supabase
        .from('quotes')
        .select('display_order')
        .order('display_order', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      const nextOrder = (maxOrder?.display_order ?? -1) + 1;
      
      const { data, error } = await supabase
        .from('quotes')
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
      queryClient.invalidateQueries({ queryKey: ['admin-quotes'] });
      toast.success('Quote created successfully');
    },
    onError: (error) => {
      toast.error(`Failed to create quote: ${error.message}`);
    },
  });

  const updateQuote = useMutation({
    mutationFn: async ({ id, ...input }: QuoteInput & { id: string }) => {
      const { data, error } = await supabase
        .from('quotes')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-quotes'] });
      toast.success('Quote updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update quote: ${error.message}`);
    },
  });

  const deleteQuote = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('quotes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-quotes'] });
      toast.success('Quote deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete quote: ${error.message}`);
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('quotes')
        .update({ is_active })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-quotes'] });
      toast.success('Quote status updated');
    },
    onError: (error) => {
      toast.error(`Failed to update status: ${error.message}`);
    },
  });

  const reorderQuotes = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const updates = orderedIds.map((id, index) => 
        supabase
          .from('quotes')
          .update({ display_order: index })
          .eq('id', id)
      );
      
      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-quotes'] });
      toast.success('Order updated');
    },
    onError: (error) => {
      toast.error(`Failed to reorder: ${error.message}`);
    },
  });

  return {
    quotes: quotesQuery.data ?? [],
    isLoading: quotesQuery.isLoading,
    error: quotesQuery.error,
    createQuote,
    updateQuote,
    deleteQuote,
    toggleActive,
    reorderQuotes,
  };
}
