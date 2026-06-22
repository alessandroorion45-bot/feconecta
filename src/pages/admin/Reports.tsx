import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdmin } from "@/contexts/AdminContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Flag, Check, X, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Report {
  id: string;
  report_type: string;
  description: string;
  status: string;
  created_at: string;
  reporter_id: string;
  reported_user_id: string;
}

export default function AdminReports() {
  const { isAdmin, hasPermission, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("pending");

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
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (filter !== "all") {
        query = query.eq("status", filter);
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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { variant: "default", icon: AlertCircle, label: "Pendente" },
      approved: { variant: "default", icon: Check, label: "Aprovada" },
      rejected: { variant: "destructive", icon: X, label: "Rejeitada" },
    };

    const config = variants[status] || variants.pending;
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
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Denúncias</h1>
          <p className="text-muted-foreground mt-1">
            Gerenciar denúncias e moderação de conteúdo
          </p>
        </div>

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
                      {getReportTypeLabel(report.report_type)}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {new Date(report.created_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  {getStatusBadge(report.status)}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4">{report.description}</p>

                {report.status === "pending" && hasPermission("reports.resolve") && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() =>
                        handleReview(report.id, "approved", "content_removed")
                      }
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Aprovar e Remover Conteúdo
                    </Button>

                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleReview(report.id, "approved", "warned")}
                    >
                      Aprovar e Advertir
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReview(report.id, "rejected", "no_action")}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Rejeitar
                    </Button>
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
    </AdminLayout>
  );
}
