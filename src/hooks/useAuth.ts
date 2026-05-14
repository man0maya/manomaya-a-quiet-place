import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthState {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    isAdmin: false,
    loading: true,
  });

  const checkAdminRole = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();

      return !error && data !== null;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setAuthState(prev => ({
          ...prev,
          session,
          user: session?.user ?? null,
        }));

        // Defer admin check with setTimeout to prevent deadlock
        if (session?.user) {
          setTimeout(async () => {
            const isAdmin = await checkAdminRole(session.user.id);
            setAuthState(prev => ({
              ...prev,
              isAdmin,
              loading: false,
            }));
          }, 0);
        } else {
          setAuthState(prev => ({
            ...prev,
            isAdmin: false,
            loading: false,
          }));
        }
      }
    );

    // Fix #3: guard against component-unmount race between getSession and onAuthStateChange
    let cancelled = false;
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (cancelled) return;
      if (session?.user) {
        const isAdmin = await checkAdminRole(session.user.id);
        if (cancelled) return;
        setAuthState({
          session,
          user: session.user,
          isAdmin,
          loading: false,
        });
      } else {
        if (cancelled) return;
        setAuthState({
          session: null,
          user: null,
          isAdmin: false,
          loading: false,
        });
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [checkAdminRole]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    const redirectUrl = `${window.location.origin}/admin`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName || '',
        },
      },
    });
    return { error };
  };

  const signOut = async () => {
    // Fix #10: optimistically clear admin state before the async event fires
    setAuthState(prev => ({ ...prev, isAdmin: false, loading: false }));
    const { error } = await supabase.auth.signOut();
    if (error) {
      // Revert if signOut failed
      setAuthState(prev => ({ ...prev, isAdmin: true }));
    }
    return { error };
  };

  return {
    ...authState,
    signIn,
    signUp,
    signOut,
  };
}
