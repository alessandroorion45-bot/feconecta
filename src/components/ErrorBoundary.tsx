import { Component, ErrorInfo, ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary for graceful degradation
 * Catches JavaScript errors and displays a friendly fallback UI
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log error for monitoring
    console.error("Error Boundary caught an error:", error, errorInfo);
    
    // Call optional error handler
    this.props.onError?.(error, errorInfo);
    
    // In production, you would send this to an error tracking service
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleGoHome = () => {
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
          <Card className="max-w-md w-full shadow-divine">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="text-xl">Ops! Algo deu errado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-center text-muted-foreground">
                Ocorreu um erro inesperado. Nossa equipe foi notificada e está trabalhando para resolver.
              </p>
              
              {process.env.NODE_ENV === "development" && this.state.error && (
                <details className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
                  <summary className="cursor-pointer font-medium">Detalhes técnicos</summary>
                  <pre className="mt-2 overflow-auto max-h-40">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}

              <div className="flex gap-3">
                <Button 
                  onClick={this.handleRetry} 
                  variant="outline" 
                  className="flex-1 gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Tentar novamente
                </Button>
                <Button 
                  onClick={this.handleGoHome} 
                  className="flex-1 gap-2"
                >
                  <Home className="h-4 w-4" />
                  Ir para início
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Lightweight error fallback component for sections
 */
export const SectionErrorFallback = ({ 
  onRetry,
  message = "Não foi possível carregar esta seção" 
}: { 
  onRetry?: () => void;
  message?: string;
}) => (
  <div className="p-6 text-center border rounded-lg bg-muted/20">
    <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
    <p className="text-sm text-muted-foreground mb-3">{message}</p>
    {onRetry && (
      <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
        <RefreshCw className="h-3 w-3" />
        Tentar novamente
      </Button>
    )}
  </div>
);

/**
 * Loading fallback component
 */
export const LoadingFallback = ({ message = "Carregando..." }: { message?: string }) => (
  <div className="flex items-center justify-center p-8">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  </div>
);

/**
 * Offline fallback component
 */
export const OfflineFallback = () => (
  <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
    <Card className="max-w-md w-full shadow-divine text-center">
      <CardContent className="pt-8 pb-6">
        <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <svg
            className="h-8 w-8 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
            />
          </svg>
        </div>
        <h2 className="text-lg font-semibold mb-2">Você está offline</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Verifique sua conexão com a internet e tente novamente.
        </p>
        <Button onClick={() => window.location.reload()} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Reconectar
        </Button>
      </CardContent>
    </Card>
  </div>
);

export default ErrorBoundary;
