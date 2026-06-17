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
        // Add timeout to prevent infinite loading
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('AUTH_TIMEOUT')), 5000)
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
        } else {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
        }
      } catch (error: any) {
        console.error('[AuthContext] Unexpected error:', error);

        // If timeout, consider user as not authenticated and continue
        if (error?.message === 'AUTH_TIMEOUT') {
          console.warn('[AuthContext] Session check timeout - assuming no session');
        }

        setSession(null);
        setUser(null);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!mounted) return;

      console.log('[AuthContext] Auth state changed:', event);

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        setSession(newSession);
        setUser(newSession?.user ?? null);
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
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
