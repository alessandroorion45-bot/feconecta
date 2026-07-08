import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Crown, Award, Flag, ShieldAlert, MessageSquare, Loader2 } from "lucide-react";

interface UserProfileDialogProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FullProfile {
  profile: {
    id: string;
    email: string;
    full_name: string;
    avatar_url: string | null;
    level: number;
    total_xp: number;
    is_vip: boolean;
    vip_tier: string | null;
    total_posts: number;
    total_comments: number;
    total_achievements: number;
    total_warnings: number;
    total_suspensions: number;
    is_banned: boolean;
    registered_at: string;
    last_sign_in_at: string | null;
    risk_score: number;
    risk_level: "baixo" | "medio" | "alto" | "critico";
  };
  punishment_history: {
    id: string;
    punishment_type: string;
    reason: string;
    issued_at: string;
    expires_at: string | null;
    is_active: boolean;
    issued_by_email: string | null;
  }[];
  reports_received: {
    id: string;
    reason: string;
    description: string | null;
    status: string;
    resolution: string | null;
    content_type: string | null;
    created_at: string;
    reporter_email: string | null;
  }[];
  reports_made_count: number;
  recent_posts: { id: string; content: string; created_at: string; likes_count: number }[];
}

const RISK_LABEL: Record<string, string> = {
  baixo: "🟢 Baixo risco",
  medio: "🟡 Médio risco",
  alto: "🟠 Alto risco",
  critico: "🔴 Crítico",
};

export function UserProfileDialog({ userId, open, onOpenChange }: UserProfileDialogProps) {
  const [data, setData] = useState<FullProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !userId) {
      setData(null);
      return;
    }

    setLoading(true);
    supabase
      .rpc("get_user_full_profile", { p_user_id: userId })
      .then(({ data: result, error }) => {
        if (error) {
          console.error("Erro ao carregar ficha do usuário:", error);
        } else {
          setData(result as unknown as FullProfile);
        }
        setLoading(false);
      });
  }, [open, userId]);

  const p = data?.profile;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {p && (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold shrink-0">
                {p.full_name?.charAt(0) || "?"}
              </div>
            )}
            {p?.full_name || "Carregando..."}
          </DialogTitle>
          <DialogDescription>{p?.email}</DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && p && (
          <div className="space-y-4">
            {/* Status badges */}
            <div className="flex flex-wrap gap-2">
              {p.is_vip && (
                <Badge variant="outline"><Crown className="h-3 w-3 mr-1 text-yellow-600" />VIP {p.vip_tier}</Badge>
              )}
              {p.is_banned && <Badge variant="destructive">Banido</Badge>}
              <Badge variant="outline">{RISK_LABEL[p.risk_level] || p.risk_level} ({p.risk_score}/100)</Badge>
              <Badge variant="outline"><Award className="h-3 w-3 mr-1" />Nível {p.level} ({p.total_xp} XP)</Badge>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
              <div className="p-3 border rounded-lg">
                <p className="text-xl font-bold">{p.total_posts}</p>
                <p className="text-xs text-muted-foreground">Posts</p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="text-xl font-bold">{p.total_achievements}</p>
                <p className="text-xs text-muted-foreground">Conquistas</p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="text-xl font-bold">{data?.reports_made_count ?? 0}</p>
                <p className="text-xs text-muted-foreground">Denúncias feitas</p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="text-xl font-bold">{data?.reports_received.length ?? 0}</p>
                <p className="text-xs text-muted-foreground">Denúncias recebidas</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Cadastrado em {new Date(p.registered_at).toLocaleDateString("pt-BR")}
              {p.last_sign_in_at && ` — último acesso ${new Date(p.last_sign_in_at).toLocaleDateString("pt-BR")}`}
            </p>

            <Tabs defaultValue="punishments">
              <TabsList>
                <TabsTrigger value="punishments">
                  <ShieldAlert className="h-4 w-4 mr-1" /> Punições
                </TabsTrigger>
                <TabsTrigger value="reports">
                  <Flag className="h-4 w-4 mr-1" /> Denúncias
                </TabsTrigger>
                <TabsTrigger value="posts">
                  <MessageSquare className="h-4 w-4 mr-1" /> Posts recentes
                </TabsTrigger>
              </TabsList>

              <TabsContent value="punishments" className="space-y-2 mt-3">
                {data?.punishment_history.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma punição registrada.</p>
                ) : (
                  data?.punishment_history.map((item) => (
                    <div key={item.id} className="border rounded-lg p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <Badge variant={item.is_active ? "destructive" : "outline"} className="text-xs">
                          {item.punishment_type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(item.issued_at).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                      <p className="mt-1">{item.reason}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Por: {item.issued_by_email || "—"}
                        {item.expires_at && ` — expira em ${new Date(item.expires_at).toLocaleDateString("pt-BR")}`}
                      </p>
                    </div>
                  ))
                )}
              </TabsContent>

              <TabsContent value="reports" className="space-y-2 mt-3">
                {data?.reports_received.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma denúncia recebida.</p>
                ) : (
                  data?.reports_received.map((item) => (
                    <div key={item.id} className="border rounded-lg p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">{item.reason}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(item.created_at).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                      {item.description && <p className="mt-1">{item.description}</p>}
                      <p className="text-xs text-muted-foreground mt-1">
                        Status: {item.status}{item.resolution && ` (${item.resolution})`} — Por: {item.reporter_email || "—"}
                      </p>
                    </div>
                  ))
                )}
              </TabsContent>

              <TabsContent value="posts" className="space-y-2 mt-3">
                {data?.recent_posts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum post recente.</p>
                ) : (
                  data?.recent_posts.map((item) => (
                    <div key={item.id} className="border rounded-lg p-3 text-sm">
                      <p>{item.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(item.created_at).toLocaleDateString("pt-BR")} — {item.likes_count} curtidas
                      </p>
                    </div>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
