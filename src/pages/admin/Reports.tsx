import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdmin } from "@/contexts/AdminContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Flag, Check, X, AlertCircle, User as UserIcon, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { UserProfileDialog } from "@/components/admin/UserProfileDialog";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { useAdminActions } from "@/hooks/useAdminActions";

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

export default function AdminReports() {
  const { isAdmin, hasPermission, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { deleteReportedContent } = useAdminActions();
  const [reports, setReports] = useState<Report[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("pending");
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
  }, [hasPermission, adminLoading, navigate, filter]);

  const loadReports = async () => {
    try {
      let query = supabase
        .from("admin_reports_detailed")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (filter === "pending") {
        query = query.eq("status", "pending");
      } else if (filter === "approved") {
        query = query.eq("resolution", "approved");
      } else if (filter === "rejected") {
        query = query.eq("resolution", "rejected");
      }

      const { data, error } = await query;

      if (error) throw error;

      setReports(data || []);
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

  const handleReview = async (
    reportId: string,
    status: string,
    action: string
  ) => {
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

  const handleDeleteContent = async (report: Report) => {
    if (!report.content_type || !report.content_id) return;
    if (!hasPermission("reports.resolve")) {
      toast({ title: "Sem permissão", description: "Você não tem permissão para excluir conteúdo.", variant: "destructive" });
      return;
    }
    if (!window.confirm("Excluir este conteúdo permanentemente? Essa ação não pode ser desfeita.")) return;

    setDeletingId(report.id);
    try {
      const success = await deleteReportedContent(report.content_type, report.content_id, `Denúncia: ${report.reason}`);
      if (!success) throw new Error("Falha ao excluir conteúdo");

      await handleReview(report.id, "approved", "content_removed");
      toast({ title: "Conteúdo excluído", description: "O conteúdo denunciado foi removido." });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message || "Não foi possível excluir o conteúdo.", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  const getReportTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      spam: "Spam",
      offensive_content: "Conteúdo Ofensivo",
      harassment: "Assédio",
      fake_profile: "Perfil Falso",
      inappropriate_language: "Linguagem Inapropriada",
      religious_attack: "Ataque Religioso",
      other: "Outro",
    };
    return types[type] || type;
  };

  const getStatusBadge = (report: Report) => {
    const displayStatus = report.status === "pending" ? "pending" : (report.resolution || "pending");
    const variants: Record<string, any> = {
      pending: { variant: "default", icon: AlertCircle, label: "Pendente" },
      approved: { variant: "default", icon: Check, label: "Aprovada" },
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
        <div className="flex gap-2">
          {["all", "pending", "approved", "rejected"].map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              onClick={() => setFilter(f)}
            >
              {f === "all" && "Todas"}
              {f === "pending" && "Pendentes"}
              {f === "approved" && "Aprovadas"}
              {f === "rejected" && "Rejeitadas"}
            </Button>
          ))}
        </div>

        {/* Reports List */}
        <div className="space-y-4">
          {reports.map((report) => (
            <Card key={report.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      <Flag className="h-5 w-5 text-red-600" />
                      {getReportTypeLabel(report.reason)}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {new Date(report.created_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  {getStatusBadge(report)}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-3">{report.description}</p>

                <button
                  onClick={() => {
                    setProfileDialogUserId(report.reported_user_id);
                    setShowProfileDialog(true);
                  }}
                  className="w-full flex items-center justify-between gap-3 p-3 mb-4 border rounded-lg hover:bg-accent transition-colors text-left"
                >
                  <div className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-sm font-medium underline decoration-dotted underline-offset-2">
                        {report.reported_user_name || report.reported_user_email || "Usuário denunciado"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Denunciado por: {report.reporter_email || "—"}
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
                    {report.content_type === "post" && report.content_id && (
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={deletingId === report.id}
                        onClick={() => handleDeleteContent(report)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        {deletingId === report.id ? "Excluindo..." : "Excluir Conteúdo"}
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
                      onClick={() => handleReview(report.id, "rejected", "no_action")}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Rejeitar
                    </Button>

                    <p className="w-full text-xs text-muted-foreground mt-1">
                      Pra advertir, suspender ou banir o usuário, clique no card dele acima.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

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
