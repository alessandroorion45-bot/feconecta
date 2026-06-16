import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, Wifi, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NetworkStatusIndicatorProps {
  showOnlyWhenOffline?: boolean;
}

export const NetworkStatusIndicator = ({ showOnlyWhenOffline = true }: NetworkStatusIndicatorProps) => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [showOnlineToast, setShowOnlineToast] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setIsReconnecting(false);
      setShowOnlineToast(true);
      setTimeout(() => setShowOnlineToast(false), 3000);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setIsReconnecting(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleRetry = () => {
    setIsReconnecting(true);
    // Try to fetch a small resource to test connection
    fetch("/robots.txt", { cache: "no-store" })
      .then(() => {
        setIsOnline(true);
        setIsReconnecting(false);
        setShowOnlineToast(true);
        setTimeout(() => setShowOnlineToast(false), 3000);
      })
      .catch(() => {
        setIsReconnecting(false);
      });
  };

  if (showOnlyWhenOffline && isOnline && !showOnlineToast) {
    return null;
  }

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-16 left-0 right-0 z-50 px-4"
        >
          <div className="max-w-md mx-auto bg-destructive text-destructive-foreground rounded-lg shadow-lg p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <WifiOff className="h-5 w-5 shrink-0" />
              <div className="text-sm">
                <p className="font-medium">Sem conexão</p>
                <p className="text-xs opacity-80">Verifique sua internet</p>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRetry}
              disabled={isReconnecting}
              className="shrink-0"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isReconnecting ? "animate-spin" : ""}`} />
              {isReconnecting ? "..." : "Tentar"}
            </Button>
          </div>
        </motion.div>
      )}
      
      {showOnlineToast && isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-16 left-0 right-0 z-50 px-4"
        >
          <div className="max-w-md mx-auto bg-green-600 text-white rounded-lg shadow-lg p-3 flex items-center gap-2">
            <Wifi className="h-5 w-5 shrink-0" />
            <p className="text-sm font-medium">Conexão restabelecida!</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NetworkStatusIndicator;
