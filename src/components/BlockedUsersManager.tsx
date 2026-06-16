import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import UserAvatar from "@/components/UserAvatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ShieldBan, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface BlockedUser {
  id: string;
  blocked_id: string;
  created_at: string;
  profile: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string | null;
  };
}

interface BlockedUsersManagerProps {
  currentUserId: string;
}

export const BlockedUsersManager = ({ currentUserId }: BlockedUsersManagerProps) => {
  const { toast } = useToast();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [unblockUserId, setUnblockUserId] = useState<string | null>(null);

  useEffect(() => {
    if (currentUserId) {
      loadBlockedUsers();
    }
  }, [currentUserId]);

  const loadBlockedUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("blocked_users")
        .select(`
          id,
          blocked_id,
          created_at,
          profiles:blocked_id (id, username, full_name, avatar_url)
        `)
        .eq("blocker_id", currentUserId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedData = data?.map(item => ({
        id: item.id,
        blocked_id: item.blocked_id,
        created_at: item.created_at,
        profile: item.profiles as any
      })) || [];

      setBlockedUsers(formattedData);
    } catch (error) {
      console.error("Error loading blocked users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (blockedUserId: string) => {
    try {
      const { error } = await supabase
        .from("blocked_users")
        .delete()
        .eq("blocker_id", currentUserId)
        .eq("blocked_id", blockedUserId);

      if (error) throw error;

      setBlockedUsers(prev => prev.filter(u => u.blocked_id !== blockedUserId));

      toast({
        title: "Usuário desbloqueado",
        description: "Este usuário agora pode interagir com você novamente",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível desbloquear o usuário",
        variant: "destructive",
      });
    } finally {
      setUnblockUserId(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldBan className="h-5 w-5" />
            Usuários Bloqueados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg border animate-pulse">
                <div className="h-10 w-10 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 bg-muted rounded" />
                  <div className="h-3 w-32 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldBan className="h-5 w-5" />
          Usuários Bloqueados
          {blockedUsers.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground">
              ({blockedUsers.length})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {blockedUsers.length === 0 ? (
          <div className="text-center py-8">
            <ShieldCheck className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">
              Você não bloqueou nenhum usuário
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="space-y-3">
              {blockedUsers.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10, height: 0 }}
                  transition={{ delay: index * 0.05 }}
                  layout
                  className="flex items-center gap-3 p-3 rounded-lg border"
                >
                  <UserAvatar
                    src={user.profile.avatar_url}
                    fallback={user.profile.full_name}
                    size="sm"
                    className="opacity-60"
                  />
                  <div className="flex-1">
                    <p className="font-medium">{user.profile.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      Bloqueado em {format(new Date(user.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setUnblockUserId(user.blocked_id)}
                  >
                    Desbloquear
                  </Button>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </CardContent>

      {/* Unblock Dialog */}
      <AlertDialog open={!!unblockUserId} onOpenChange={() => setUnblockUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desbloquear usuário?</AlertDialogTitle>
            <AlertDialogDescription>
              Este usuário poderá ver seu perfil, enviar pedidos de amizade e interagir com você novamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => unblockUserId && handleUnblock(unblockUserId)}>
              Desbloquear
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default BlockedUsersManager;
