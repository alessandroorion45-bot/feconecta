import { motion } from "framer-motion";
import { Church, Loader2 } from "lucide-react";

interface LoadingFallbackProps {
  message?: string;
  showLogo?: boolean;
}

export const LoadingFallback = ({ message = "Carregando...", showLogo = true }: LoadingFallbackProps) => {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4 p-4">
      {showLogo && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="p-4 rounded-2xl bg-gradient-primary shadow-glow"
        >
          <Church className="h-8 w-8 sm:h-10 sm:w-10 text-primary-foreground" />
        </motion.div>
      )}
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col items-center gap-2"
      >
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </motion.div>
    </div>
  );
};

export default LoadingFallback;
