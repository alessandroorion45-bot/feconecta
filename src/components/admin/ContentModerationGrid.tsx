import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/contexts/AdminContext";
import { useAdminActions } from "@/hooks/useAdminActions";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Heart, MessageCircle, Flag, Check, EyeOff, Trash2, AlertTriangle,
  UserX, Ban, ChevronLeft, ChevronRight, Play, Eye, Clock, RefreshCw,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { AdminMediaLightbox, type LightboxItem } from "./AdminMediaLightbox";

type ViewName = "admin_all_photos" | "admin_all_videos";

interface RawRow {
  id: string;
  user_id: string;
  user_email: string | null;
  user_name: string | null;
  caption: string | null;
  likes_count: number;
  comments_count: number;
  views_count?: number | null;
  duration_seconds?: number | null;
  created_at: string;
  pending_reports: number;
  total_reports: number;
  is_hidden: boolean;
  moderation_status: string | null;
  [key: string]: unknown;
}

type FilterKey = "all" | "recent" | "oldest" | "most_liked" | "most_commented" | "under_review" | "reported" | "removed";

// "Todas" e "Mais Recentes" usam a mesma ordenação (denunciadas sempre
// no topo, depois mais novas primeiro) — a distinção é só de rótulo,
// pra bater com o vocabulário pedido, já que tecnicamente é a mesma
// consulta base.
const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Todas" },
  { key: "recent", label: "Mais Recentes" },
  { key: "oldest", label: "Mais Antigas" },
  { key: "most_liked", label: "Mais Curtidas" },
  { key: "most_commented", label: "Mais Comentadas" },
  { key: "under_review", label: "Em Análise" },
  { key: "reported", label: "Denunciadas" },
  { key: "removed", label: "Removidas" },
];

const PAGE_SIZE = 24;

function formatDuration(seconds?: number | null) {
  if (!seconds && seconds !== 0) return null;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface ContentModerationGridProps {
  kind: "photo" | "video";
  viewName: ViewName;
  typeColumn: "photo_type" | "video_type";
  urlColumn: "photo_url" | "video_url";
}

export function ContentModerationGrid({ kind, viewName, typeColumn, urlColumn }: ContentModerationGridProps) {
  const { user } = useAuth();
  const { hasPermission } = useAdmin();
  const { deleteReportedContent, warnUser, suspendUser, banUser } = useAdminActions();
  const { toast } = useToast();

  const [items, setItems] = useState<RawRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ id: string; action: "hide" | "delete" } | null>(null);
  const [punishTarget, setPunishTarget] = useState<{ userId: string; itemId: string; action: "warn" | "suspend" | "ban" } | null>(null);
  const [punishReason, setPunishReason] = useState("");
  const [liveCount, setLiveCount] = useState(0);
  const filterRef = useRef(filter);
  filterRef.current = filter;

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      // any: mesmo com "viewName" tipado como union literal, resolver
      // .from(viewName) contra o Database inteiro do types.ts gerado (100+
      // tabelas/views) já estoura "type instantiation excessively deep"
      // sozinho — o shape real é validado manualmente via RawRow no
      // resultado, então o cast aqui não perde segurança de tipo de verdade.
      const sb: any = supabase;
      let query = sb.from(viewName).select("*", { count: "exact" });

      switch (filter) {
        case "oldest":
          query = query.order("created_at", { ascending: true });
          break;
        case "most_liked":
          query = query.order("likes_count", { ascending: false }).order("created_at", { ascending: false });
          break;
        case "most_commented":
          query = query.order("comments_count", { ascending: false }).order("created_at", { ascending: false });
          break;
        case "under_review":
          query = query.gt("pending_reports", 0).order("pending_reports", { ascending: false }).order("created_at", { ascending: false });
          break;
        case "reported":
          query = query.gt("total_reports", 0).order("total_reports", { ascending: false }).order("created_at", { ascending: false });
          break;
        case "removed":
          query = query.eq("is_hidden", true).order("created_at", { ascending: false });
          break;
        default:
          // "Todas"/"Mais Recentes": denunciadas sempre sobem pro topo
          query = query.order("pending_reports", { ascending: false }).order("created_at", { ascending: false });
      }

      query = query.range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

      const { data, error, count } = await query;
      if (error) throw error;
      setItems((data as RawRow[]) || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error(`[ContentModerationGrid:${kind}] Erro ao carregar:`, error);
      toast({ title: "Erro", description: "Não foi possível carregar o conteúdo.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [viewName, filter, page, kind, toast]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  useEffect(() => {
    setPage(0);
  }, [filter]);

  // Tempo real: nova denúncia ou novo conteúdo chega sem precisar recarregar a página.
  useEffect(() => {
    const baseTables = kind === "photo" ? ["posts", "profile_photos"] : ["posts", "user_videos"];
    const channel = supabase.channel(`admin-${kind}s-realtime`);
    channel.on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "user_reports" },
      () => {
        setLiveCount((c) => c + 1);
        if (filterRef.current === "under_review" || filterRef.current === "reported" || filterRef.current === "all") {
          loadItems();
        }
      }
    );
    for (const table of baseTables) {
      channel.on("postgres_changes", { event: "*", schema: "public", table }, () => {
        loadItems();
      });
    }
    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  const handleApprove = async (item: RawRow) => {
    if (!user?.id || !hasPermission("content.moderate")) return;
    setBusyId(item.id);
    try {
      const { error } = await supabase.rpc("approve_photo", {
        p_photo_id: item.id,
        p_photo_type: item[typeColumn] as string,
        p_admin_id: user.id,
      });
      if (error) throw error;
      toast({ title: "Aprovado" });
      loadItems();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const handleHideOrDelete = async () => {
    if (!confirmAction || !user?.id) return;
    const item = items.find((i) => i.id === confirmAction.id);
    if (!item) return;
    setBusyId(item.id);
    try {
      if (confirmAction.action === "delete") {
        const ok = await deleteReportedContent(item[typeColumn] as string, item.id);
        if (!ok) throw new Error("Falha ao excluir");
      } else {
        const { error } = await supabase.rpc("hide_photo", {
          p_photo_id: item.id,
          p_photo_type: item[typeColumn] as string,
          p_admin_id: user.id,
        });
        if (error) throw error;
      }
      toast({ title: confirmAction.action === "delete" ? "Excluído" : "Ocultado" });
      setConfirmAction(null);
      loadItems();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const handlePunish = async () => {
    if (!punishTarget || !punishReason.trim()) return;
    setBusyId(punishTarget.itemId);
    try {
      const success =
        punishTarget.action === "warn"
          ? await warnUser(punishTarget.userId, punishReason)
          : punishTarget.action === "suspend"
          ? await suspendUser(punishTarget.userId, punishReason, 7)
          : await banUser(punishTarget.userId, punishReason);
      if (!success) throw new Error("Falha ao aplicar ação");
      toast({
        title:
          punishTarget.action === "warn" ? "Usuário advertido" : punishTarget.action === "suspend" ? "Usuário suspenso" : "Usuário banido",
      });
      setPunishTarget(null);
      setPunishReason("");
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const lightboxItems: LightboxItem[] = items.map((i) => ({
    url: i[urlColumn] as string,
    kind: kind === "video" ? "video" : "image",
    caption: i.caption,
    authorName: i.user_name,
  }));

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Select value={filter} onValueChange={(v) => setFilter(v as FilterKey)}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FILTERS.map((f) => (
              <SelectItem key={f.key} value={f.key}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" onClick={loadItems} className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" />
          Atualizar
          {liveCount > 0 && (
            <Badge variant="destructive" className="ml-1 h-4 px-1 text-[10px]">
              +{liveCount}
            </Badge>
          )}
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando...</div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">Nenhum conteúdo encontrado.</CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((item, idx) => {
            const duration = formatDuration(item.duration_seconds);
            const reported = item.pending_reports > 0;
            return (
              <Card
                key={item.id}
                className={cn(
                  "overflow-hidden transition-shadow",
                  reported && "ring-2 ring-red-500 shadow-lg shadow-red-500/10"
                )}
              >
                <div
                  className="relative aspect-square bg-muted cursor-pointer group"
                  onClick={() => setLightboxIndex(idx)}
                >
                  {kind === "video" ? (
                    <>
                      {item.thumbnail_url ? (
                        <img src={item.thumbnail_url as string} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <video src={item[urlColumn] as string} className="w-full h-full object-cover" muted preload="metadata" />
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                        <Play className="h-10 w-10 text-white drop-shadow-lg" fill="white" />
                      </div>
                      {duration && (
                        <Badge className="absolute bottom-2 right-2 bg-black/70 text-white border-none text-[10px]">
                          {duration}
                        </Badge>
                      )}
                    </>
                  ) : (
                    <img src={item[urlColumn] as string} alt="" className="w-full h-full object-cover" />
                  )}

                  {reported && (
                    <Badge variant="destructive" className="absolute top-2 left-2 gap-1">
                      <Flag className="h-3 w-3" />
                      {item.pending_reports}
                    </Badge>
                  )}
                  {item.moderation_status === "removed" && (
                    <Badge variant="outline" className="absolute top-2 right-2 bg-background/90">
                      Removido
                    </Badge>
                  )}
                  <Badge variant="secondary" className="absolute bottom-2 left-2 text-[10px]">
                    {item[typeColumn] as string}
                  </Badge>
                </div>

                <CardContent className="p-3 space-y-2">
                  <div>
                    <p className="text-sm font-medium truncate">{item.user_name || "Sem nome"}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.user_email}</p>
                  </div>
                  {item.caption && <p className="text-xs text-muted-foreground line-clamp-2">{item.caption}</p>}

                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Heart className="h-3 w-3" /> {item.likes_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" /> {item.comments_count}
                    </span>
                    {kind === "video" && (
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" /> {item.views_count ?? 0}
                      </span>
                    )}
                    <span className="flex items-center gap-1 ml-auto">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: ptBR })}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {hasPermission("content.moderate") && (
                      <Button size="sm" variant="outline" className="h-7 px-2" disabled={busyId === item.id} onClick={() => handleApprove(item)}>
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {hasPermission("content.moderate") && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2"
                        disabled={busyId === item.id}
                        onClick={() => setConfirmAction({ id: item.id, action: "hide" })}
                      >
                        <EyeOff className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {hasPermission("content.delete") && (
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-7 px-2"
                        disabled={busyId === item.id}
                        onClick={() => setConfirmAction({ id: item.id, action: "delete" })}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-amber-600"
                      disabled={busyId === item.id}
                      onClick={() => setPunishTarget({ userId: item.user_id, itemId: item.id, action: "warn" })}
                      title="Advertir usuário"
                    >
                      <AlertTriangle className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-orange-600"
                      disabled={busyId === item.id}
                      onClick={() => setPunishTarget({ userId: item.user_id, itemId: item.id, action: "suspend" })}
                      title="Suspender usuário"
                    >
                      <UserX className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-red-600"
                      disabled={busyId === item.id}
                      onClick={() => setPunishTarget({ userId: item.user_id, itemId: item.id, action: "ban" })}
                      title="Banir usuário"
                    >
                      <Ban className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {punishTarget?.itemId === item.id && (
                    <div className="pt-2 space-y-2 border-t">
                      <Textarea
                        placeholder="Motivo (obrigatório)..."
                        value={punishReason}
                        onChange={(e) => setPunishReason(e.target.value)}
                        rows={2}
                        className="text-xs"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" variant="destructive" disabled={!punishReason.trim() || busyId === item.id} onClick={handlePunish}>
                          Confirmar
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => { setPunishTarget(null); setPunishReason(""); }}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  )}

                  {confirmAction?.id === item.id && (
                    <div className="pt-2 space-y-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        {confirmAction.action === "delete"
                          ? "Excluir permanentemente? Não pode ser desfeito."
                          : "Ocultar este conteúdo? Pode ser revertido com Aprovar."}
                      </p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="destructive" disabled={busyId === item.id} onClick={handleHideOrDelete}>
                          Confirmar
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setConfirmAction(null)}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {page + 1} de {totalPages} ({totalCount} itens)
          </span>
          <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      <AdminMediaLightbox
        items={lightboxItems}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onNavigate={setLightboxIndex}
      />
    </div>
  );
}
