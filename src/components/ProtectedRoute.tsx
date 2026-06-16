import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const AUTH_TOKEN_KEY = 'sb-ucpsiqmsxocwasorvojw-auth-token';

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * ProtectedRoute component that wraps protected pages.
 * Uses fast-path strategy: renders immediately if local token exists,
 * only redirects to /auth when confirmed no session exists.
 */
export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const [hasLocalToken, setHasLocalToken] = useState<boolean | null>(null);

  // Fast-path: Check localStorage immediately
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!storedToken) {
        setHasLocalToken(false);
        return;
      }
      
      const parsed = JSON.parse(storedToken);
      if (!parsed?.expires_at) {
        setHasLocalToken(false);
        return;
      }
      
      // Check if token is not expired (with 60s buffer)
      const expiresAt = parsed.expires_at * 1000;
      setHasLocalToken(Date.now() < expiresAt - 60000);
    } catch {
      setHasLocalToken(false);
    }
  }, []);

  // Still determining token status
  if (hasLocalToken === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Fast-path: If we have a valid local token, render immediately
  if (hasLocalToken) {
    return <>{children}</>;
  }

  // No local token, check SDK state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // SDK confirmed authentication
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // No authentication, redirect to login
  return <Navigate to="/auth" state={{ from: location }} replace />;
};
