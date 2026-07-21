import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import UserAvatar from "@/components/UserAvatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Bell,
  Check,
  UserPlus,
  MessageCircle,
  Heart,
  Users,
  Trophy,
  Star,
  ThumbsUp,
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle,
  Megaphone,
  UserX,
  Ban,
  BookOpenCheck,
  HelpCircle,
  CalendarDays,
  Flame,
  Crown,
  HandHeart,
} from "lucide-react";

// Avisos do admin (Central de Notificações + punições) usam um "type"
// com prefixo admin_ (admin_info/admin_success/admin_warning/
// admin_announcement/admin_suspend/admin_ban) pra poder ter ícone/cor/
// destaque diferente de acordo com a gravidade — pedido explícito: aviso
// do admin precisa chamar mais atenção que uma notificação social comum.
const ADMIN_NOTICE_STYLES: Record<string, { icon: JSX.Element; accent: string; bg: string }> = {
  admin_info: {
    icon: <Info className="h-4 w-4 text-blue-500" />,
    accent: "border-l-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950/30",
  },
  admin_success: {
    icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
    accent: "border-l-green-500",
    bg: "bg-green-50 dark:bg-green-950/30",
  },
  admin_warning: {
    icon: <AlertTriangle className="h-4 w-4 text-amber-500" />,
    accent: "border-l-amber-500",
    bg: "bg-amber-50 dark:bg-amber-950/30",
  },
  admin_announcement: {
    icon: <Megaphone className="h-4 w-4 text-pink-500" />,
    accent: "border-l-pink-500",
    bg: "bg-pink-50 dark:bg-pink-950/30",
  },
  admin_suspend: {
    icon: <UserX className="h-4 w-4 text-orange-500" />,
    accent: "border-l-orange-500",
    bg: "bg-orange-50 dark:bg-orange-950/30",
  },
  admin_ban: {
    icon: <Ban className="h-4 w-4 text-red-600" />,
    accent: "border-l-red-600",
    bg: "bg-red-50 dark:bg-red-950/30",
  },
};
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface NotificationPanelProps {
  /** Sobrescreve as classes do botão-gatilho (usado pra encaixar num grupo visual) */
  triggerClassName?: string;
}

const NotificationPanel = ({ triggerClassName }: NotificationPanelProps = {}) => {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);

  const getNotificationIcon = (type: string) => {
    if (ADMIN_NOTICE_STYLES[type]) return ADMIN_NOTICE_STYLES[type].icon;
    switch (type) {
      case "friend_request":
        return <UserPlus className="h-4 w-4 text-blue-500" />;
      case "friend_accepted":
        return <Users className="h-4 w-4 text-green-500" />;
      case "message":
        return <MessageCircle className="h-4 w-4 text-primary" />;
      case "faith_post":
        return <Heart className="h-4 w-4 text-pink-500" />;
      case "follow":
        return <UserPlus className="h-4 w-4 text-purple-500" />;
      case "testimony_like":
      case "post_like":
        return <ThumbsUp className="h-4 w-4 text-red-500" />;
      case "testimony_comment":
      case "post_comment":
        return <MessageCircle className="h-4 w-4 text-blue-500" />;
      case "testimony_glory":
        return <Sparkles className="h-4 w-4 text-yellow-500" />;
      case "prayer_intercession":
      case "prayer_interaction":
        return <Heart className="h-4 w-4 text-purple-500" />;
      case "prayer_comment":
        return <MessageCircle className="h-4 w-4 text-purple-500" />;
      case "community_invite":
        return <UserPlus className="h-4 w-4 text-emerald-500" />;
      case "achievement":
        return <Trophy className="h-4 w-4 text-yellow-500" />;
      case "friend_testimonial":
      case "testimonial_approved":
      case "testimonial_rejected":
        return <Star className="h-4 w-4 text-orange-500" />;
      case "community_study":
        return <BookOpenCheck className="h-4 w-4 text-amber-500" />;
      case "community_activity":
        return <HelpCircle className="h-4 w-4 text-amber-500" />;
      case "community_event":
        return <CalendarDays className="h-4 w-4 text-amber-500" />;
      case "community_announcement":
        return <Megaphone className="h-4 w-4 text-amber-500" />;
      case "community_campaign":
        return <Flame className="h-4 w-4 text-orange-500" />;
      case "community_new_leader":
        return <Crown className="h-4 w-4 text-amber-500" />;
      case "cell_prayer_request":
        return <HandHeart className="h-4 w-4 text-emerald-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const handleNotificationClick = (notification: any, e: React.MouseEvent) => {
    e.stopPropagation();
    markAsRead(notification.id);
    
    // Navegar baseado no tipo
    switch (notification.type) {
      case "friend_request":
      case "friend_accepted":
      case "follow":
        navigate("/friends");
        setOpen(false);
        break;
      case "message":
        navigate("/friends");
        setOpen(false);
        break;
      case "faith_post":
      case "friend_testimonial":
      case "testimonial_approved":
      case "testimonial_rejected":
        if (notification.actor_id) {
          navigate(`/profile/${notification.actor_id}`);
          setOpen(false);
        }
        break;
      case "testimony_like":
      case "testimony_comment":
      case "testimony_glory":
        navigate("/testimonies");
        setOpen(false);
        break;
      case "post_like":
      case "post_comment":
        navigate("/feed");
        setOpen(false);
        break;
      case "prayer_intercession":
      case "prayer_interaction":
      case "prayer_comment":
        navigate("/prayers");
        setOpen(false);
        break;
      case "community_invite":
        // Abre o fluxo de boas-vindas da comunidade convidada
        if (notification.reference_id) {
          navigate(`/church-community?join=${notification.reference_id}`);
          setOpen(false);
        }
        break;
      case "achievement":
        navigate("/achievements");
        setOpen(false);
        break;
      case "community_study":
      case "community_activity":
      case "community_event":
      case "community_announcement":
      case "community_campaign":
      case "community_new_leader":
      case "cell_prayer_request":
        if (notification.reference_id) {
          navigate(`/church-community?join=${notification.reference_id}`);
          setOpen(false);
        }
        break;
      default:
        // Apenas marca como lida, não fecha o painel
        break;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className={cn("gap-2 relative", triggerClassName)}>
          <Bell className="h-4 w-4" />
          <span className="hidden md:inline">Notificações</span>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notificações</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                markAllAsRead();
              }}
              className="text-xs"
            >
              <Check className="h-3 w-3 mr-1" />
              Marcar todas como lidas
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhuma notificação</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => {
                const adminStyle = ADMIN_NOTICE_STYLES[notification.type];
                return (
                <div
                  key={notification.id}
                  onClick={(e) => handleNotificationClick(notification, e)}
                  className={`p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                    adminStyle
                      ? `border-l-4 ${adminStyle.accent} ${!notification.is_read ? adminStyle.bg : ""}`
                      : !notification.is_read ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="flex gap-3">
                    {notification.actor_id ? (
                      <UserAvatar
                        src={notification.profiles?.avatar_url}
                        fallback={notification.profiles?.username || "?"}
                        size="xs"
                      />
                    ) : (
                      <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Bell className="h-3 w-3 text-primary" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2">
                        {getNotificationIcon(notification.type)}
                        <p className="text-sm">
                          {notification.actor_id && (
                            <span className="font-semibold">
                              {notification.profiles?.username || "Alguém"}
                            </span>
                          )}{" "}
                          {notification.content}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    )}
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationPanel;
