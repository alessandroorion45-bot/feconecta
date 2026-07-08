import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// ✅ Auth token key unificado (project ID correto)
const AUTH_TOKEN_KEY = 'sb-kfetvofrwtuduwmpvdlz-auth-token';

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
  const currentUserIdRef = useRef<string | null>(null);

  // Initialize auth state with Supabase session and react to changes.
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('[AuthContext] Initializing auth...');

        // Try to get session from localStorage first (faster)
        const storedSession = localStorage.getItem(AUTH_TOKEN_KEY);
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

        // Get session with timeout (30 segundos para conexões lentas)
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('AUTH_TIMEOUT')), 30000)
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
          currentUserIdRef.current = null;
        } else if (currentSession) {
          console.log('[AuthContext] Session found for user:', currentSession.user.email);
          setSession(currentSession);
          setUser(currentSession.user);
          currentUserIdRef.current = currentSession.user.id;
        } else {
          console.log('[AuthContext] No session found');
          setSession(null);
          setUser(null);
          currentUserIdRef.current = null;
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
        currentUserIdRef.current = newSession?.user?.id ?? null;

        if (event === 'SIGNED_IN' && newSession?.user) {
          const userId = newSession.user.id;
          // Deferido com setTimeout: nunca fazer await de chamadas Supabase
          // dentro do callback de onAuthStateChange (causa deadlock do lock
          // interno de auth — ver memória "project-deadlock-supabase").
          setTimeout(() => {
            supabase.rpc('log_user_activity', {
              p_user_id: userId,
              p_action_type: 'login',
              p_details: null,
            }).then(({ error }) => {
              if (error) console.error('[AuthContext] Erro ao logar login:', error);
            });
          }, 0);
        }
      } else if (event === 'SIGNED_OUT') {
        console.warn('[AuthContext] User signed out - event triggered');
        const loggedOutUserId = currentUserIdRef.current;
        setSession(null);
        setUser(null);
        currentUserIdRef.current = null;

        if (loggedOutUserId) {
          setTimeout(() => {
            supabase.rpc('log_user_activity', {
              p_user_id: loggedOutUserId,
              p_action_type: 'logout',
              p_details: null,
            }).then(({ error }) => {
              if (error) console.error('[AuthContext] Erro ao logar logout:', error);
            });
          }, 0);
        }
      } else if (event === 'INITIAL_SESSION') {
        console.log('[AuthContext] Initial session loaded');
        setSession(newSession);
        setUser(newSession?.user ?? null);
        currentUserIdRef.current = newSession?.user?.id ?? null;
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    try {
      console.log('[AuthContext] Iniciando logout...');

      // Limpar estado PRIMEIRO (para UI responder rápido)
      setSession(null);
      setUser(null);

      // Fazer logout no Supabase
      await supabase.auth.signOut();

      // ✅ Limpar APENAS keys de autenticação (preservar cache da Bíblia)
      const authKeys = Object.keys(localStorage).filter(key =>
        key.startsWith('sb-') ||
        key.includes('auth') ||
        key.includes('supabase') ||
        key.includes('session')
      );
      authKeys.forEach(key => localStorage.removeItem(key));

      console.log('[AuthContext] Logout completo! Cache da Bíblia preservado.');
    } catch (error) {
      console.error('[AuthContext] Erro no logout:', error);
      // Mesmo com erro, garantir que estado local está limpo
      setSession(null);
      setUser(null);

      // ✅ Limpar apenas auth keys
      const authKeys = Object.keys(localStorage).filter(key =>
        key.startsWith('sb-') ||
        key.includes('auth') ||
        key.includes('supabase') ||
        key.includes('session')
      );
      authKeys.forEach(key => localStorage.removeItem(key));
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
