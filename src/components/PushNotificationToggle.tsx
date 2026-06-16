import { Bell, BellOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const PushNotificationToggle = () => {
  const { isSupported, isSubscribed, isLoading, subscribe, unsubscribe, permission } = usePushNotifications();

  if (!isSupported) {
    return null;
  }

  const handleClick = () => {
    if (isSubscribed) {
      unsubscribe();
    } else {
      subscribe();
    }
  };

  const getTooltipText = () => {
    if (permission === 'denied') {
      return "Notificações bloqueadas pelo navegador";
    }
    if (isSubscribed) {
      return "Desativar notificações push";
    }
    return "Ativar notificações push";
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClick}
            disabled={isLoading || permission === 'denied'}
            className="gap-2 h-10 px-3"
            aria-label={getTooltipText()}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isSubscribed ? (
              <Bell className="h-4 w-4 text-green-500" />
            ) : (
              <BellOff className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="hidden sm:inline text-sm">
              {isSubscribed ? "Push ativo" : "Ativar Push"}
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getTooltipText()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default PushNotificationToggle;
