import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdmin } from "@/contexts/AdminContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Image, Eye, EyeOff, Trash2, Flag, Check, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Photo {
  id: string;
  photo_type: string;
  user_id: string;
  user_email: string;
  user_name: string;
  photo_url: string;
  caption: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  pending_reports: number;
  moderation_status: string | null;
}

export default function AdminPhotos() {
  const { isAdmin, hasPermission, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [actionType, setActionType] = useState<"hide" | "delete">("hide");
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 24;

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate("/");
      return;
    }

    if (isAdmin) {
      loadPhotos();
    }
  }, [isAdmin, adminLoading, navigate, filter, page]);

  useEffect(() => {
    setPage(0);
  }, [filter]);

  const loadPhotos = async () => {
    try {
      setLoading(true);
      let viewName = "admin_all_photos";

      if (filter === "recent") {
        viewName = "admin_recent_photos";
      } else if (filter === "reported") {
        viewName = "admin_reported_photos";
      }

      const { data, error, count } = await supabase
        .from(viewName)
        .select("*", { count: "exact" })
        .not("photo_url", "is", null)
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

      if (error) throw error;

      setPhotos(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error("Erro ao carregar fotos:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar fotos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleHidePhoto = async (photo: Photo) => {
    if (!hasPermission("content.moderate")) {
      toast({
        title: "Sem permissão",
        description: "Você não tem permissão para ocultar fotos.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error("Usuário não autenticado");

      const { error } = await supabase.rpc("hide_photo", {
        p_photo_id: photo.id,
        p_photo_type: photo.photo_type,
        p_admin_id: currentUser.user.id,
        p_reason: "Moderação administrativa",
      });

      if (error) throw error;

      toast({
        title: "Foto Ocultada",
        description: "A foto foi ocultada com sucesso.",
      });

      loadPhotos();
      setShowDeleteDialog(false);
      setSelectedPhoto(null);
    } catch (error: any) {
      console.error("Erro ao ocultar foto:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível ocultar foto.",
        variant: "destructive",
      });
    }
  };

  const handleDeletePhoto = async (photo: Photo) => {
    if (!hasPermission("content.delete")) {
      toast({
        title: "Sem permissão",
        description: "Você não tem permissão para excluir fotos.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error("Usuário não autenticado");

      const { error } = await supabase.rpc("delete_photo", {
        p_photo_id: photo.id,
        p_photo_type: photo.photo_type,
        p_admin_id: currentUser.user.id,
        p_reason: "Violação das diretrizes",
      });

      if (error) throw error;

      toast({
        title: "Foto Excluída",
        description: "A foto foi excluída permanentemente.",
      });

      loadPhotos();
      setShowDeleteDialog(false);
      setSelectedPhoto(null);
    } catch (error: any) {
      console.error("Erro ao excluir foto:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível excluir foto.",
        variant: "destructive",
      });
    }
  };

  const handleApprovePhoto = async (photo: Photo) => {
    if (!hasPermission("content.moderate")) {
      toast({
        title: "Sem permissão",
        description: "Você não tem permissão para aprovar fotos.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error("Usuário não autenticado");

      const { error } = await supabase.rpc("approve_photo", {
        p_photo_id: photo.id,
        p_photo_type: photo.photo_type,
        p_admin_id: currentUser.user.id,
      });

      if (error) throw error;

      toast({
        title: "Foto Aprovada",
        description: "A foto foi aprovada com sucesso.",
      });

      loadPhotos();
    } catch (error: any) {
      console.error("Erro ao aprovar foto:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível aprovar foto.",
        variant: "destructive",
      });
    }
  };

  const getTypeBadge = (type: string) => {
    const types: Record<string, { label: string; color: string }> = {
      post: { label: "Post", color: "bg-blue-500" },
      profile_photo: { label: "Perfil", color: "bg-purple-500" },
    };

    const typeData = types[type] || { label: type, color: "bg-gray-500" };

    return (
      <Badge className={`${typeData.color} text-white text-xs`}>
        {typeData.label}
      </Badge>
    );
  };

  if (adminLoading || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Carregando fotos...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Gerenciador de Fotos
            </h1>
            <p className="text-muted-foreground mt-1">
              Moderar e gerenciar fotos da plataforma
            </p>
          </div>

          <div className="flex gap-2">
            <Badge variant="outline" className="text-lg px-4 py-2">
              <Image className="h-4 w-4 mr-2" />
              {totalCount} Fotos
            </Badge>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filtrar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="recent">Últimas 24h</SelectItem>
                  <SelectItem value="reported">Denunciadas</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={loadPhotos}>
                Atualizar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Photos Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <Card key={photo.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {/* Image */}
              <div className="relative aspect-square bg-muted">
                {photo.photo_url ? (
                  <img
                    src={photo.photo_url}
                    alt={photo.caption || "Foto"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Image className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}

                {/* Badges */}
                <div className="absolute top-2 left-2 flex gap-2">
                  {getTypeBadge(photo.photo_type)}
                  {photo.pending_reports > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      <Flag className="h-3 w-3 mr-1" />
                      {photo.pending_reports}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Info */}
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{photo.user_name || "Sem nome"}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {photo.user_email}
                    </p>
                  </div>
                </div>

                {photo.caption && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {photo.caption}
                  </p>
                )}

                {/* Stats */}
                <div className="flex gap-3 text-xs text-muted-foreground">
                  <span>❤️ {photo.likes_count}</span>
                  {photo.comments_count > 0 && (
                    <span>💬 {photo.comments_count}</span>
                  )}
                </div>

                {/* Actions */}
                <div className="grid grid-cols-3 gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs px-2"
                    onClick={() => handleApprovePhoto(photo)}
                    disabled={!hasPermission("content.moderate")}
                  >
                    <Check className="h-3 w-3" />
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs px-2"
                    onClick={() => {
                      setSelectedPhoto(photo);
                      setActionType("hide");
                      setShowDeleteDialog(true);
                    }}
                    disabled={!hasPermission("content.moderate")}
                  >
                    <EyeOff className="h-3 w-3" />
                  </Button>

                  <Button
                    size="sm"
                    variant="destructive"
                    className="text-xs px-2"
                    onClick={() => {
                      setSelectedPhoto(photo);
                      setActionType("delete");
                      setShowDeleteDialog(true);
                    }}
                    disabled={!hasPermission("content.delete")}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {photos.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma foto encontrada.</p>
            </CardContent>
          </Card>
        )}

        {totalCount > PAGE_SIZE && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-muted-foreground">
              Página {page + 1} de {Math.max(1, Math.ceil(totalCount / PAGE_SIZE))}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => (p + 1) * PAGE_SIZE < totalCount ? p + 1 : p)}
                disabled={(page + 1) * PAGE_SIZE >= totalCount}
              >
                Próxima <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete/Hide Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              {actionType === "delete" ? "Excluir Foto?" : "Ocultar Foto?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === "delete"
                ? "Esta ação é permanente e não pode ser desfeita. A foto será excluída do banco de dados."
                : "A foto será ocultada mas permanecerá no banco de dados."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedPhoto(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedPhoto) {
                  if (actionType === "delete") {
                    handleDeletePhoto(selectedPhoto);
                  } else {
                    handleHidePhoto(selectedPhoto);
                  }
                }
              }}
              className={actionType === "delete" ? "bg-red-600 hover:bg-red-700" : ""}
            >
              {actionType === "delete" ? "Excluir" : "Ocultar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
