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

  // Fast-path: Check localStorage for existing token
  const hasValidLocalToken = useCallback((): boolean => {
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

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Fast-path: If we have a valid local token, trust it initially
        const hasLocalToken = hasValidLocalToken();
        
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (error) {
          console.error('[AuthContext] Error getting session:', error.message);
          if (!hasLocalToken) {
            setSession(null);
            setUser(null);
          }
        } else {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
        }
      } catch (error) {
        console.error('[AuthContext] Unexpected error:', error);
        if (!hasValidLocalToken()) {
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

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!mounted) return;

      console.log('[AuthContext] Auth state changed:', event);

      // Only update state for meaningful events
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setSession(newSession);
        setUser(newSession?.user ?? null);
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
      } else if (event === 'INITIAL_SESSION') {
        // Already handled in initializeAuth
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [hasValidLocalToken]);

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
