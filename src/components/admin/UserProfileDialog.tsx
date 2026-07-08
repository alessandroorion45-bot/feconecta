import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Crown, Award, Flag, ShieldAlert, MessageSquare, Loader2, AlertTriangle, UserX, Ban } from "lucide-react";
import { getSeverityConfig } from "@/lib/adminSeverity";
import { useAdminActions } from "@/hooks/useAdminActions";
import { useToast } from "@/hooks/use-toast";

interface UserProfileDialogProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** chamado depois de advertir/suspender/banir com sucesso, pra quem abriu o dialog recarregar sua lista */
  onActionTaken?: () => void;
}

type PunishAction = "warn" | "suspend" | "ban" | null;

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


export function UserProfileDialog({ userId, open, onOpenChange, onActionTaken }: UserProfileDialogProps) {
  const [data, setData] = useState<FullProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const { warnUser, suspendUser, banUser } = useAdminActions();
  const { toast } = useToast();

  const [punishAction, setPunishAction] = useState<PunishAction>(null);
  const [punishReason, setPunishReason] = useState("");
  const [punishDays, setPunishDays] = useState("7");
  const [punishing, setPunishing] = useState(false);

  const loadProfile = () => {
    if (!userId) return;
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
  };

  useEffect(() => {
    if (!open || !userId) {
      setData(null);
      setPunishAction(null);
      setPunishReason("");
      return;
    }
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, userId]);

  const p = data?.profile;

  const handleConfirmPunish = async () => {
    if (!userId || !punishAction || !punishReason.trim()) return;
    setPunishing(true);
    try {
      const success =
        punishAction === "warn"
          ? await warnUser(userId, punishReason)
          : punishAction === "suspend"
          ? await suspendUser(userId, punishReason, parseInt(punishDays, 10) || 7)
          : await banUser(userId, punishReason);

      if (success) {
        toast({
          title:
            punishAction === "warn" ? "Usuário advertido" : punishAction === "suspend" ? "Usuário suspenso" : "Usuário banido",
        });
        setPunishAction(null);
        setPunishReason("");
        loadProfile();
        onActionTaken?.();
      } else {
        throw new Error("Falha ao aplicar a ação");
      }
    } catch (error: any) {
      toast({ title: "Erro", description: error.message || "Não foi possível aplicar a ação.", variant: "destructive" });
    } finally {
      setPunishing(false);
    }
  };

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
              <Badge variant="outline">{getSeverityConfig(p.risk_level).emoji} {getSeverityConfig(p.risk_level).label} risco ({p.risk_score}/100)</Badge>
              <Badge variant="outline"><Award className="h-3 w-3 mr-1" />Nível {p.level} ({p.total_xp} XP)</Badge>
            </div>

            {/* Ações de moderação — o "papel de juiz" do admin */}
            <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-muted/30">
              <Button
                size="sm"
                variant={punishAction === "warn" ? "default" : "outline"}
                onClick={() => setPunishAction(punishAction === "warn" ? null : "warn")}
              >
                <AlertTriangle className="h-4 w-4 mr-1" />
                Advertir
              </Button>
              <Button
                size="sm"
                variant={punishAction === "suspend" ? "default" : "outline"}
                onClick={() => setPunishAction(punishAction === "suspend" ? null : "suspend")}
              >
                <UserX className="h-4 w-4 mr-1" />
                Suspender temporariamente
              </Button>
              <Button
                size="sm"
                variant={punishAction === "ban" ? "destructive" : "outline"}
                onClick={() => setPunishAction(punishAction === "ban" ? null : "ban")}
              >
                <Ban className="h-4 w-4 mr-1" />
                Banir permanentemente
              </Button>
            </div>

            {punishAction && (
              <div className="p-3 border rounded-lg space-y-2">
                <Textarea
                  placeholder="Motivo (obrigatório)..."
                  value={punishReason}
                  onChange={(e) => setPunishReason(e.target.value)}
                  rows={2}
                />
                {punishAction === "suspend" && (
                  <Select value={punishDays} onValueChange={setPunishDays}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 dia</SelectItem>
                      <SelectItem value="3">3 dias</SelectItem>
                      <SelectItem value="7">7 dias</SelectItem>
                      <SelectItem value="15">15 dias</SelectItem>
                      <SelectItem value="30">30 dias</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={!punishReason.trim() || punishing}
                    onClick={handleConfirmPunish}
                  >
                    {punishing ? "Aplicando..." : "Confirmar"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setPunishAction(null)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            )}

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
