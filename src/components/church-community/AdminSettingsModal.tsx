import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Trash2, UserCheck, AlertTriangle, Loader2 } from "lucide-react";
import RectAvatar from "@/components/RectAvatar";

const sb = supabase as any;

interface Member {
  id: string;
  user_id: string;
  role: string;
  profile: {
    full_name: string;
    username: string;
    avatar_url: string | null;
  } | null;
}

interface AdminSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  communityId: string;
  communityName: string;
  userId: string;
  onCommunityDeleted: () => void;
}

const AdminSettingsModal = ({
  open,
  onOpenChange,
  communityId,
  communityName,
  userId,
  onCommunityDeleted,
}: AdminSettingsModalProps) => {
  const { toast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteFinal, setShowDeleteFinal] = useState(false);
  const [showTransferSelect, setShowTransferSelect] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Member | null>(null);
  const [showTransferConfirm, setShowTransferConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [confirmName, setConfirmName] = useState("");
  const [deleteCounts, setDeleteCounts] = useState<{ members: number; campaigns: number; votings: number; posts: number } | null>(null);

  const nameMatches = confirmName.trim().toLowerCase() === communityName.trim().toLowerCase();

  const loadDeleteCounts = async () => {
    const countOf = async (table: string) => {
      try {
        const { count } = await sb.from(table).select("id", { count: "exact", head: true }).eq("community_id", communityId);
        return count || 0;
      } catch {
        return 0;
      }
    };
    const [members, campaigns, votings, posts] = await Promise.all([
      countOf("church_community_members"),
      countOf("community_campaigns"),
      countOf("community_votings"),
      countOf("community_posts"),
    ]);
    setDeleteCounts({ members, campaigns, votings, posts });
  };

  useEffect(() => {
    if (open) {
      loadMembers();
    }
  }, [open, communityId]);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("church_community_members")
        .select("id, user_id, role")
        .eq("community_id", communityId)
        .eq("is_active", true)
        .neq("user_id", userId);

      if (error) throw error;

      const enrichedMembers = await Promise.all(
        (data || []).map(async (member) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, username, avatar_url")
            .eq("id", member.user_id)
            .single();
          return { ...member, profile };
        })
      );

      setMembers(enrichedMembers);
    } catch (error) {
      console.error("Error loading members:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCommunity = async () => {
    setIsDeleting(true);
    try {
      // Log the action
      await supabase.from("community_action_history").insert({
        community_id: communityId,
        action_type: "community_deleted",
        performed_by: userId,
        details: { community_name: communityName },
      });

      // Create notifications for all members
      const { data: membersData } = await supabase
        .from("church_community_members")
        .select("user_id")
        .eq("community_id", communityId)
        .eq("is_active", true)
        .neq("user_id", userId);

      if (membersData) {
        const notifications = membersData.map((m) => ({
          user_id: m.user_id,
          actor_id: userId,
          type: "community_deleted",
          content: `A comunidade "${communityName}" foi excluída pelo administrador ⛪`,
        }));

        if (notifications.length > 0) {
          await supabase.from("notifications").insert(notifications);
        }
      }

      // Limpeza explícita dos dados vinculados (não depende de CASCADE no banco)
      const relatedTables = [
        "community_post_amens", // via posts (FK cascade), mas garante
        "community_posts",
        "community_campaign_checkins",
        "community_campaign_participants",
        "community_campaigns",
        "community_votes",
        "community_votings",
        "community_comments",
        "leader_evaluations",
        "church_leaders",
        "admin_transfer_votings",
        "community_action_history",
        "church_community_members",
      ];
      for (const table of relatedTables) {
        try {
          if (table === "community_votes") {
            // votos não têm community_id: apaga pelos ids das votações
            const { data: votings } = await sb.from("community_votings").select("id").eq("community_id", communityId);
            const ids = (votings || []).map((v: any) => v.id);
            if (ids.length) await sb.from("community_votes").delete().in("voting_id", ids);
          } else if (table === "community_post_amens" || table === "community_campaign_checkins" || table === "community_campaign_participants") {
            // dependem de FK cascade das tabelas-pai criadas hoje; nada a fazer aqui
            continue;
          } else {
            await sb.from(table).delete().eq("community_id", communityId);
          }
        } catch {
          // tabela pode não existir ou já ter cascade — segue em frente
        }
      }

      // Notificações relacionadas à comunidade
      try {
        await sb.from("notifications").delete().eq("reference_id", communityId);
      } catch { /* melhor-esforço */ }

      // Delete the community
      const { error } = await supabase
        .from("church_communities")
        .delete()
        .eq("id", communityId);

      if (error) throw error;

      toast({
        title: "✅ Comunidade excluída",
        description: "A comunidade foi removida com sucesso.",
      });

      onOpenChange(false);
      onCommunityDeleted();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteFinal(false);
    }
  };

  const handleStartTransfer = async () => {
    if (!selectedCandidate) return;

    setIsTransferring(true);
    try {
      // Get total active members count
      const { count } = await supabase
        .from("church_community_members")
        .select("*", { count: "exact", head: true })
        .eq("community_id", communityId)
        .eq("is_active", true);

      // Create the voting
      const { data: voting, error: votingError } = await supabase
        .from("admin_transfer_votings")
        .insert({
          community_id: communityId,
          initiated_by: userId,
          candidate_id: selectedCandidate.user_id,
          total_members: count || 0,
          status: "active",
        })
        .select()
        .single();

      if (votingError) throw votingError;

      // Log the action
      await supabase.from("community_action_history").insert({
        community_id: communityId,
        action_type: "transfer_voting_started",
        performed_by: userId,
        target_user_id: selectedCandidate.user_id,
        details: {
          candidate_name: selectedCandidate.profile?.full_name,
          voting_id: voting.id,
        },
      });

      // Notify all members
      const { data: membersData } = await supabase
        .from("church_community_members")
        .select("user_id")
        .eq("community_id", communityId)
        .eq("is_active", true);

      if (membersData) {
        const notifications = membersData.map((m) => ({
          user_id: m.user_id,
          actor_id: userId,
          type: "admin_transfer_voting",
          content: `Votação iniciada: ${selectedCandidate.profile?.full_name} foi indicado(a) como novo(a) administrador(a) 🗳️`,
          reference_id: voting.id,
        }));

        await supabase.from("notifications").insert(notifications);
      }

      toast({
        title: "🗳️ Votação iniciada!",
        description: `Os membros podem votar para aprovar ${selectedCandidate.profile?.full_name} como novo administrador.`,
      });

      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro ao iniciar votação",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsTransferring(false);
      setShowTransferConfirm(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Configurações Administrativas
            </DialogTitle>
            <DialogDescription>
              Gerencie a comunidade com cuidado. Essas ações afetam todos os membros.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Card className="border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-primary" />
                  Transferir Administração
                </CardTitle>
                <CardDescription className="text-sm">
                  Inicia uma votação democrática para transferir a administração.
                  Requer 80% de aprovação dos membros.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowTransferSelect(true)}
                >
                  Selecionar Candidato
                </Button>
              </CardContent>
            </Card>

            <Card className="border-destructive/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-destructive">
                  <Trash2 className="h-4 w-4" />
                  Excluir Comunidade
                </CardTitle>
                <CardDescription className="text-sm">
                  Esta ação é irreversível. Todos os dados serão perdidos.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => {
                    setConfirmName("");
                    setDeleteCounts(null);
                    loadDeleteCounts();
                    setShowDeleteConfirm(true);
                  }}
                >
                  Excluir Comunidade
                </Button>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transfer Member Selection Dialog */}
      <Dialog open={showTransferSelect} onOpenChange={setShowTransferSelect}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Selecionar Novo Administrador</DialogTitle>
            <DialogDescription>
              Escolha um membro para ser o candidato à nova administração.
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : members.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              Não há outros membros na comunidade.
            </p>
          ) : (
            <div className="space-y-2">
              {members.map((member) => (
                <Card
                  key={member.id}
                  className={`cursor-pointer transition-all ${
                    selectedCandidate?.id === member.id
                      ? "border-primary bg-primary/5"
                      : "hover:border-primary/50"
                  }`}
                  onClick={() => setSelectedCandidate(member)}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <RectAvatar
                      src={member.profile?.avatar_url}
                      fallback={member.profile?.full_name || "Membro"}
                      size="sm"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {member.profile?.full_name || "Membro"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        @{member.profile?.username}
                      </p>
                    </div>
                    {member.role === "leader" && (
                      <Badge variant="secondary">Líder</Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowTransferSelect(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                setShowTransferSelect(false);
                setShowTransferConfirm(true);
              }}
              disabled={!selectedCandidate}
              className="flex-1"
            >
              Continuar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transfer Confirmation */}
      <AlertDialog open={showTransferConfirm} onOpenChange={setShowTransferConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Transferência</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Você está prestes a iniciar uma votação para transferir a
                administração para{" "}
                <strong>{selectedCandidate?.profile?.full_name}</strong>.
              </p>
              <p>
                A votação requer <strong>80% de aprovação</strong> dos membros
                ativos para ser válida.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isTransferring}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStartTransfer}
              disabled={isTransferring}
            >
              {isTransferring ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Iniciando...
                </>
              ) : (
                "Iniciar Votação"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete First Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Excluir Comunidade
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a comunidade "{communityName}"?
              Todos os membros serão notificados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowDeleteConfirm(false);
                setShowDeleteFinal(true);
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              Sim, continuar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Final Confirmation */}
      <AlertDialog open={showDeleteFinal} onOpenChange={setShowDeleteFinal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Confirmação Final — {communityName}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <span className="block font-semibold text-destructive">
                Você tem certeza que deseja excluir esta comunidade? Esta ação é
                permanente e removerá todos os dados relacionados.
              </span>

              {/* O que será excluído */}
              <span className="grid grid-cols-2 gap-2 text-sm">
                <span className="rounded-lg bg-muted/60 px-3 py-2">
                  👥 <strong>{deleteCounts?.members ?? "…"}</strong> membros
                </span>
                <span className="rounded-lg bg-muted/60 px-3 py-2">
                  🔥 <strong>{deleteCounts?.campaigns ?? "…"}</strong> campanhas
                </span>
                <span className="rounded-lg bg-muted/60 px-3 py-2">
                  🗳️ <strong>{deleteCounts?.votings ?? "…"}</strong> votações
                </span>
                <span className="rounded-lg bg-muted/60 px-3 py-2">
                  📢 <strong>{deleteCounts?.posts ?? "…"}</strong> publicações
                </span>
              </span>

              <span className="block text-sm">
                Para confirmar, digite o nome da comunidade:{" "}
                <strong className="select-all">{communityName}</strong>
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <Input
            placeholder={`Digite "${communityName}" para confirmar`}
            value={confirmName}
            onChange={(e) => setConfirmName(e.target.value)}
            disabled={isDeleting}
            className={nameMatches ? "border-destructive" : ""}
          />

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCommunity}
              disabled={isDeleting || !nameMatches}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Excluir Permanentemente"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AdminSettingsModal;
