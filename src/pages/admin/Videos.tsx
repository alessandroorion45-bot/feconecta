import { useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdmin } from "@/contexts/AdminContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ContentModerationGrid } from "@/components/admin/ContentModerationGrid";

export default function AdminVideos() {
  const { isLoading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading || adminLoading) return;
    if (!isAdmin) navigate("/");
  }, [isAdmin, authLoading, adminLoading, navigate]);

  if (!isAdmin) return null;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeader
          title="Gerenciador de Vídeos"
          description="Todos os vídeos publicados pelos usuários, com moderação em tempo real"
        />
        <ContentModerationGrid kind="video" viewName="admin_all_videos" typeColumn="video_type" urlColumn="video_url" />
      </div>
    </AdminLayout>
  );
}
