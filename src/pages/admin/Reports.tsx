import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdmin } from "@/contexts/AdminContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Flag, Check, X, AlertCircle, User as UserIcon, Trash2, EyeOff, ArrowUpDown, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { UserProfileDialog } from "@/components/admin/UserProfileDialog";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { useAdminActions } from "@/hooks/useAdminActions";
import { getReportReasonLabel, REPORT_REASONS } from "@/lib/reportReasons";

interface Report {
  id: string;
  reason: string;
  description: string | null;
  status: string;
  resolution: string | null;
  content_type: string | null;
  content_id: string | null;
  created_at: string;
  reporter_id: string;
  reporter_email: string | null;
  reported_user_id: string;
  reported_user_email: string | null;
  reported_user_name: string | null;
  reported_user_total_reports: number;
  reported_user_total_punishments: number;
}

interface ReportedContent {
  text: string | null;
  media_url: string | null;
  media_type: string | null;
  author_name: string | null;
  author_email: string | null;
  created_at: string;
  is_hidden: boolean;
}

// Tipos de conteúdo que já têm coluna is_hidden real — só esses ganham
// o botão "Ocultar" (reversível). Os demais só têm "Excluir".
const HIDE_CAPABLE = new Set(["post", "post_video", "profile_photo", "user_video", "verse_comment"]);

export default function AdminReports() {
  const { hasPermission, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { deleteReportedContent } = useAdminActions();
  const [reports, setReports] = useState<Report[]>([]);
  const [contentPreviews, setContentPreviews] = useState<Record<string, ReportedContent | null>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("pending");
  const [reasonFilter, setReasonFilter] = useState<string>("all");
  const [sortAsc, setSortAsc] = useState(false);
  const [profileDialogUserId, setProfileDialogUserId] = useState<string | null>(null);
  const [showProfileDialog, setShowProfileDialog] = useState(false);

  useEffect(() => {
    if (!adminLoading && !hasPermission("reports.view")) {
      navigate("/");
      return;
    }

    if (hasPermission("reports.view")) {
      loadReports();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPermission, adminLoading, navigate, filter, reasonFilter, sortAsc]);

  const loadReports = async () => {
    try {
      let query = supabase
        .from("admin_reports_detailed")
        .select("*")
        .order("created_at", { ascending: sortAsc })
        .limit(50);

      if (filter === "pending") {
        query = query.eq("status", "pending");
      } else if (filter === "approved") {
        query = query.eq("resolution", "approved");
      } else if (filter === "rejected") {
        query = query.eq("resolution", "rejected");
      }

      if (reasonFilter !== "all") {
        query = query.eq("reason", reasonFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      setReports(data || []);

      // Busca o conteúdo real (texto/mídia) de cada denúncia, pro admin
      // ver a publicação completa antes de decidir — sem isso só dava
      // pra ver o texto que o denunciante escreveu.
      const withContent = (data || []).filter((r) => r.content_type && r.content_id);
      const previews = await Promise.all(
        withContent.map(async (r) => {
          const { data: content } = await supabase.rpc("get_reported_content", {
            p_content_type: r.content_type,
            p_content_id: r.content_id,
          });
          return [r.id, content as unknown as ReportedContent | null] as const;
        })
      );
      setContentPreviews(Object.fromEntries(previews));
    } catch (error) {
      console.error("Erro ao carregar denúncias:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar denúncias.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (reportId: string, status: string, action: string) => {
    if (!hasPermission("reports.resolve")) {
      toast({
        title: "Sem permissão",
        description: "Você não tem permissão para revisar denúncias.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error("Usuário não autenticado");

      const { error } = await supabase.rpc("review_report", {
        p_report_id: reportId,
        p_reviewer_id: currentUser.user.id,
        p_status: status,
        p_action_taken: action,
        p_moderator_notes: `Ação: ${action}`,
      });

      if (error) throw error;

      toast({
        title: "Denúncia Revisada",
        description: `Ação aplicada: ${action}`,
      });

      loadReports();
    } catch (error: any) {
      console.error("Erro ao revisar denúncia:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível revisar denúncia.",
        variant: "destructive",
      });
    }
  };

  const handleHideContent = async (report: Report) => {
    if (!report.content_type || !report.content_id) return;
    if (!hasPermission("reports.resolve")) return;

    setBusyId(report.id);
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error("Usuário não autenticado");

      const { error } = await supabase.rpc("hide_photo", {
        p_photo_id: report.content_id,
        p_photo_type: report.content_type,
        p_admin_id: currentUser.user.id,
        p_reason: `Denúncia: ${report.reason}`,
      });
      if (error) throw error;

      await handleReview(report.id, "approved", "content_hidden");
      toast({ title: "Conteúdo ocultado", description: "Pode ser revertido depois se necessário." });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message || "Não foi possível ocultar.", variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteContent = async (report: Report) => {
    if (!report.content_type || !report.content_id) return;
    if (!hasPermission("reports.resolve")) {
      toast({ title: "Sem permissão", description: "Você não tem permissão para excluir conteúdo.", variant: "destructive" });
      return;
    }
    if (!window.confirm("Excluir este conteúdo permanentemente? Essa ação não pode ser desfeita.")) return;

    setBusyId(report.id);
    try {
      const success = await deleteReportedContent(report.content_type, report.content_id, `Denúncia: ${report.reason}`);
      if (!success) throw new Error("Falha ao excluir conteúdo");

      await handleReview(report.id, "approved", "content_removed");
      toast({ title: "Conteúdo excluído", description: "O conteúdo denunciado foi removido." });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message || "Não foi possível excluir o conteúdo.", variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const getStatusBadge = (report: Report) => {
    const displayStatus = report.status === "pending" ? "pending" : (report.resolution || "pending");
    const variants: Record<string, any> = {
      pending: { variant: "default", icon: AlertCircle, label: "Pendente" },
      approved: { variant: "default", icon: Check, label: "Resolvida" },
      rejected: { variant: "destructive", icon: X, label: "Rejeitada" },
    };

    const config = variants[displayStatus] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant as any}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  if (adminLoading || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Carregando denúncias...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!hasPermission("reports.view")) {
    return null;
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeader
          title="Denúncias"
          description="Gerenciar denúncias e moderação de conteúdo"
        />

        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          {["all", "pending", "approved", "rejected"].map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f === "all" && "Todas"}
              {f === "pending" && "Pendentes"}
              {f === "approved" && "Resolvidas"}
              {f === "rejected" && "Rejeitadas"}
            </Button>
          ))}

          <Select value={reasonFilter} onValueChange={setReasonFilter}>
            <SelectTrigger className="w-48 h-9">
              <SelectValue placeholder="Motivo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os motivos</SelectItem>
              {REPORT_REASONS.map((r) => (
                <SelectItem key={r.key} value={r.key}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={() => setSortAsc((s) => !s)} className="gap-1.5">
            <ArrowUpDown className="h-3.5 w-3.5" />
            {sortAsc ? "Mais antigas" : "Mais recentes"}
          </Button>
        </div>

        {/* Reports List */}
        <div className="space-y-4">
          {reports.map((report) => {
            const preview = report.content_id ? contentPreviews[report.id] : undefined;
            return (
              <Card key={report.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        <Flag className="h-5 w-5 text-red-600" />
                        {getReportReasonLabel(report.reason)}
                        {report.content_type && (
                          <Badge variant="secondary" className="text-[10px] font-normal">
                            {report.content_type}
                          </Badge>
                        )}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {new Date(report.created_at).toLocaleString("pt-BR")}
                      </p>
                    </div>
                    {getStatusBadge(report)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Motivo detalhado: </span>
                    {report.description || "—"}
                  </p>

                  {/* Preview do conteúdo denunciado */}
                  {preview && (
                    <div className={`rounded-lg border p-3 ${preview.is_hidden ? "opacity-60" : ""}`}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs text-muted-foreground">
                          Publicação de {preview.author_name || preview.author_email}
                        </p>
                        {preview.is_hidden && (
                          <Badge variant="outline" className="text-[10px]">Já oculto/removido</Badge>
                        )}
                      </div>
                      {preview.text && (
                        <p className="text-sm whitespace-pre-wrap line-clamp-4">{preview.text}</p>
                      )}
                      {preview.media_url && preview.media_type === "image" && (
                        <img src={preview.media_url} alt="" className="mt-2 max-h-48 rounded-md object-cover" />
                      )}
                      {preview.media_url && preview.media_type === "video" && (
                        <div className="mt-2 relative max-h-48 overflow-hidden rounded-md bg-muted flex items-center justify-center">
                          <Play className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      {preview.media_url && preview.media_type === "audio" && (
                        <audio controls src={preview.media_url} className="mt-2 w-full h-9" />
                      )}
                    </div>
                  )}
                  {report.content_id && preview === null && (
                    <p className="text-xs text-muted-foreground italic">
                      Conteúdo original não encontrado (pode já ter sido excluído).
                    </p>
                  )}

                  <button
                    onClick={() => {
                      setProfileDialogUserId(report.reported_user_id);
                      setShowProfileDialog(true);
                    }}
                    className="w-full flex items-center justify-between gap-3 p-3 border rounded-lg hover:bg-accent transition-colors text-left"
                  >
                    <div className="flex items-center gap-2">
                      <UserIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-sm font-medium underline decoration-dotted underline-offset-2">
                          {report.reported_user_name || report.reported_user_email || "Usuário denunciado"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Denunciado por: {report.reporter_email || "—"} (anônimo pro denunciado)
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Badge variant="outline" className="text-xs">
                        {report.reported_user_total_reports} denúncia(s)
                      </Badge>
                      {report.reported_user_total_punishments > 0 && (
                        <Badge variant="outline" className="text-xs text-orange-600">
                          {report.reported_user_total_punishments} punição(ões)
                        </Badge>
                      )}
                    </div>
                  </button>

                  {report.status === "pending" && hasPermission("reports.resolve") && (
                    <div className="flex flex-wrap gap-2">
                      {report.content_type && report.content_id && HIDE_CAPABLE.has(report.content_type) && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busyId === report.id}
                          onClick={() => handleHideContent(report)}
                        >
                          <EyeOff className="h-4 w-4 mr-1" />
                          Ocultar
                        </Button>
                      )}

                      {report.content_type && report.content_id && (
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={busyId === report.id}
                          onClick={() => handleDeleteContent(report)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          {busyId === report.id ? "Excluindo..." : "Excluir Conteúdo"}
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReview(report.id, "approved", "reviewed_no_deletion")}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Marcar como Procedente
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReview(report.id, "rejected", "ignored")}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Ignorar denúncia
                      </Button>

                      <p className="w-full text-xs text-muted-foreground mt-1">
                        Pra advertir, suspender ou banir o usuário, clique no card dele acima.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {reports.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Nenhuma denúncia encontrada.
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <UserProfileDialog
        userId={profileDialogUserId}
        open={showProfileDialog}
        onOpenChange={setShowProfileDialog}
        onActionTaken={loadReports}
      />
    </AdminLayout>
  );
}
