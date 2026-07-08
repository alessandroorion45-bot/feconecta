import { useEffect, useState, useCallback } from "react";
import { Bell, Flag, Ban, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface AdminNotification {
  id: string;
  type: "report" | "ban" | "signup";
  title: string;
  description: string;
  createdAt: string;
  path: string;
}

const MAX_NOTIFICATIONS = 20;

export function AdminNotificationBell() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  const pushNotification = useCallback((item: AdminNotification, notify: boolean) => {
    setNotifications((prev) => [item, ...prev].slice(0, MAX_NOTIFICATIONS));
    setUnreadCount((prev) => prev + 1);
    if (notify) {
      toast({ title: item.title, description: item.description });
    }
  }, [toast]);

  useEffect(() => {
    const channel = supabase
      .channel('admin-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'user_reports' }, (payload) => {
        pushNotification({
          id: `report-${payload.new.id}`,
          type: 'report',
          title: '🚩 Nova denúncia',
          description: payload.new.reason || 'Denúncia recebida',
          createdAt: payload.new.created_at,
          path: '/admin/reports',
        }, true);
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_logs' }, (payload) => {
        const actionType = payload.new.action_type as string;
        if (actionType === 'ban_user') {
          pushNotification({
            id: `log-${payload.new.id}`,
            type: 'ban',
            title: '🚫 Usuário banido',
            description: payload.new.action_description || 'Um administrador baniu um usuário',
            createdAt: payload.new.created_at,
            path: '/admin/users',
          }, true);
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'users' }, (payload) => {
        pushNotification({
          id: `signup-${payload.new.id}`,
          type: 'signup',
          title: '👋 Novo cadastro',
          description: payload.new.full_name || payload.new.email || 'Novo usuário na plataforma',
          createdAt: payload.new.created_at,
          path: '/admin/users',
        }, false);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pushNotification]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) setUnreadCount(0);
  };

  const getIcon = (type: AdminNotification["type"]) => {
    if (type === 'report') return Flag;
    if (type === 'ban') return Ban;
    return UserPlus;
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center text-[10px]"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="p-3 border-b font-medium text-sm">Notificações em tempo real</div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground text-center">
              Nenhuma notificação ainda. Novas denúncias, banimentos e cadastros aparecem aqui ao vivo.
            </p>
          ) : (
            notifications.map((item) => {
              const Icon = getIcon(item.type);
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setOpen(false);
                    navigate(item.path);
                  }}
                  className="w-full text-left p-3 border-b last:border-0 hover:bg-accent transition-colors flex gap-3"
                >
                  <Icon className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(item.createdAt).toLocaleTimeString("pt-BR")}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
