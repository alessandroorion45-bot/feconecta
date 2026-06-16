import { useState, useEffect, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

const AUTH_TOKEN_KEY = 'sb-ucpsiqmsxocwasorvojw-auth-token';

interface AuthSessionState {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasValidToken: boolean;
}

/**
 * Hook for accessing auth session with fast-path optimization.
 * Prioritizes localStorage token to enable instant rendering while
 * verifying session in background.
 */
export const useAuthSession = (): AuthSessionState => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasValidToken, setHasValidToken] = useState(false);

  // Fast-path: Check localStorage for existing token
  const checkLocalToken = useCallback((): boolean => {
    try {
      const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!storedToken) return false;
      
      const parsed = JSON.parse(storedToken);
      if (!parsed?.expires_at) return false;
      
      // Check if token is not expired (with 60s buffer)
      const expiresAt = parsed.expires_at * 1000;
      return Date.now() < expiresAt - 60000;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      // Fast-path check
      const tokenValid = checkLocalToken();
      if (mounted) {
        setHasValidToken(tokenValid);
      }

      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (error) {
          console.error('[useAuthSession] Error:', error.message);
          if (!tokenValid) {
            setSession(null);
            setUser(null);
          }
        } else {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          setHasValidToken(!!currentSession);
        }
      } catch (err) {
        console.error('[useAuthSession] Unexpected error:', err);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initialize();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!mounted) return;

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setHasValidToken(!!newSession);
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setHasValidToken(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [checkLocalToken]);

  return {
    session,
    user,
    isLoading,
    isAuthenticated: !!user || hasValidToken,
    hasValidToken,
  };
};
