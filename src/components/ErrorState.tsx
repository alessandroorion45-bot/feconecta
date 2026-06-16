import { motion } from "framer-motion";
import { AlertCircle, RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  isNetworkError?: boolean;
}

export const ErrorState = ({ 
  title = "Algo deu errado", 
  message = "Não foi possível carregar os dados",
  onRetry,
  isNetworkError = false
}: ErrorStateProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center text-center p-6 sm:p-8"
    >
      <div className="p-4 rounded-full bg-destructive/10 mb-4">
        {isNetworkError ? (
          <WifiOff className="h-8 w-8 text-destructive" />
        ) : (
          <AlertCircle className="h-8 w-8 text-destructive" />
        )}
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-4">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Tentar novamente
        </Button>
      )}
    </motion.div>
  );
};

export default ErrorState;
