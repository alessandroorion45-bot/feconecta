import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

const AUTH_TOKEN_KEY = 'sb-ucpsiqmsxocwasorvojw-auth-token';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state with Supabase session and react to changes.
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('[AuthContext] Initializing auth...');

        // Try to get session from localStorage first (faster)
        const storedSession = localStorage.getItem('sb-kfetvofrwtuduwmpvdlz-auth-token');
        if (storedSession) {
          try {
            const parsed = JSON.parse(storedSession);
            if (parsed?.access_token) {
              console.log('[AuthContext] Found stored session, verifying...');
            }
          } catch (e) {
            console.warn('[AuthContext] Invalid stored session');
          }
        }

        // Get session with longer timeout (10s instead of 5s)
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('AUTH_TIMEOUT')), 10000)
        );

        const sessionPromise = supabase.auth.getSession();

        const { data: { session: currentSession }, error } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]) as Awaited<ReturnType<typeof supabase.auth.getSession>>;

        if (!mounted) return;

        if (error) {
          console.error('[AuthContext] Error getting session:', error.message);
          setSession(null);
          setUser(null);
        } else if (currentSession) {
          console.log('[AuthContext] Session found for user:', currentSession.user.email);
          setSession(currentSession);
          setUser(currentSession.user);
        } else {
          console.log('[AuthContext] No session found');
          setSession(null);
          setUser(null);
        }
      } catch (error: any) {
        console.error('[AuthContext] Unexpected error:', error);

        // If timeout, DON'T clear session - keep existing state
        if (error?.message === 'AUTH_TIMEOUT') {
          console.warn('[AuthContext] Session check timeout - keeping existing state');
          // Don't touch session/user state on timeout
        } else {
          setSession(null);
          setUser(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!mounted) return;

      console.log('[AuthContext] Auth state changed:', event, 'Session:', newSession ? 'exists' : 'null');

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        console.log('[AuthContext] Session updated:', event);
        setSession(newSession);
        setUser(newSession?.user ?? null);
      } else if (event === 'SIGNED_OUT') {
        console.warn('[AuthContext] User signed out - event triggered');
        setSession(null);
        setUser(null);
      } else if (event === 'INITIAL_SESSION') {
        console.log('[AuthContext] Initial session loaded');
        setSession(newSession);
        setUser(newSession?.user ?? null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem(AUTH_TOKEN_KEY);
      setSession(null);
      setUser(null);
    } catch (error) {
      console.error('[AuthContext] Error signing out:', error);
    }
  }, []);

  const value: AuthContextType = {
    session,
    user,
    isLoading,
    isAuthenticated: !!user,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
