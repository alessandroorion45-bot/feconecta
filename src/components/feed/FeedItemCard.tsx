import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import UserAvatar from "@/components/UserAvatar";
import ImageLightbox from "@/components/ImageLightbox";
import { FeedReactionPicker } from "./FeedReactionPicker";
import { FeedComments } from "./FeedComments";
import { ReportContentModal } from "@/components/ReportContentModal";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FEED_TYPE_META } from "@/lib/feed/feedTypes";
import type { FeedItem, FeedItemType } from "@/lib/feed/feedTypes";
import {
  Heart, MessageCircle, Share2, Bookmark, Copy, Flag,
  MoreHorizontal, ExternalLink, ChevronDown, ChevronUp, Play, Pencil, Trash2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

// Tabela/coluna real por trás de cada tipo editável/exclúivel pelo dono —
// só esses 4 tipos são conteúdo de fato autorado pelo usuário no feed
// (study/devotional/community/reading são curados ou de outra área).
const EDITABLE_TABLE: Partial<Record<FeedItemType, { table: string; column: string }>> = {
  post: { table: "posts", column: "content" },
  prayer: { table: "prayers", column: "description" },
  testimony: { table: "testimonies", column: "content" },
  question: { table: "bible_questions", column: "body" },
};

interface FeedItemCardProps {
  item: FeedItem;
  userId: string | undefined;
  isFriend: boolean;
  onPatch: (key: string, patch: (i: FeedItem) => Partial<FeedItem>) => void;
}

export const FeedItemCard = ({ item, userId, isFriend, onPatch }: FeedItemCardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showComments, setShowComments] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(item.content);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);

  const meta = FEED_TYPE_META[item.type];
  const displayName = item.profile?.full_name || item.author_name || meta.label;
  const isPost = item.type === 'post';
  const longContent = item.content.length > 380;
  const isOwner = !!userId && item.user_id === userId;
  const editableTarget = EDITABLE_TABLE[item.type];

  if (deleted) return null;

  // --- Ações ---

  const toggleLike = async () => {
    if (!userId || !isPost) return;
    const wasLiked = item.liked_by_me;
    onPatch(item.key, (i) => ({
      liked_by_me: !wasLiked,
      likes_count: (i.likes_count || 0) + (wasLiked ? -1 : 1),
    }));
    if (wasLiked) {
      await supabase.from('post_likes').delete().eq('post_id', item.id).eq('user_id', userId);
    } else {
      await supabase.from('post_likes').insert({ post_id: item.id, user_id: userId });
    }
  };

  const toggleSave = async () => {
    if (!userId) {
      toast({ title: "Faça login", description: "Você precisa estar logado para salvar", variant: "destructive" });
      return;
    }
    const wasSaved = item.saved_by_me;
    onPatch(item.key, () => ({ saved_by_me: !wasSaved }));
    try {
      if (wasSaved) {
        await (supabase as any)
          .from('feed_favorites')
          .delete()
          .eq('user_id', userId)
          .eq('item_type', item.type)
          .eq('item_id', item.id);
        toast({ title: "Removido dos favoritos" });
      } else {
        const { error } = await (supabase as any)
          .from('feed_favorites')
          .upsert(
            { user_id: userId, item_type: item.type, item_id: item.id },
            { onConflict: 'user_id,item_type,item_id' }
          );
        if (error) throw error;
        toast({ title: "Salvo nos favoritos! ⭐" });
      }
    } catch {
      onPatch(item.key, () => ({ saved_by_me: wasSaved }));
      toast({
        title: "Favoritos indisponíveis",
        description: "Aplique a atualização do banco (APLICAR_FEED_SQL.sql)",
        variant: "destructive",
      });
    }
  };

  const share = async () => {
    const url = `${window.location.origin}${item.link}`;
    const text = item.title ? `${item.title}\n\n${item.content}` : item.content;
    try {
      if (navigator.share) {
        await navigator.share({ title: item.title || 'FeConecta', text: text.slice(0, 300), url });
      } else {
        await navigator.clipboard.writeText(`${text.slice(0, 300)}\n\n${url}`);
        toast({ title: "Link copiado! 🔗", description: "Cole onde quiser compartilhar" });
      }
    } catch {
      // usuário cancelou o share nativo
    }
  };

  const copyContent = async () => {
    const text = item.title ? `${item.title}\n\n${item.content}` : item.content;
    await navigator.clipboard.writeText(text);
    toast({ title: "Copiado! 📋" });
  };

  const handleSaveEdit = async () => {
    if (!editableTarget || !editContent.trim()) return;
    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from(editableTarget.table)
        .update({ [editableTarget.column]: editContent.trim() })
        .eq('id', item.id);
      if (error) throw error;
      onPatch(item.key, () => ({ content: editContent.trim() }));
      setEditing(false);
      toast({ title: "Publicação atualizada" });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message || "Não foi possível editar", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editableTarget) return;
    setDeleting(true);
    try {
      const { error } = await (supabase as any).from(editableTarget.table).delete().eq('id', item.id);
      if (error) throw error;
      setDeleted(true);
      toast({ title: "Publicação excluída" });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message || "Não foi possível excluir", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const openOriginal = () => navigate(item.link);

  return (
    <Card className="shadow-divine overflow-hidden">
      <CardContent className="pt-5 pb-4">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-start gap-3 min-w-0">
            {item.user_id && item.profile ? (
              <UserAvatar
                src={item.profile.avatar_url || undefined}
                fallback={displayName}
                size="md"
                onClick={() => navigate(`/profile/${item.user_id}`)}
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-lg shrink-0">
                {meta.emoji}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p
                  className={cn("font-semibold truncate", item.user_id && "cursor-pointer hover:underline")}
                  onClick={() => item.user_id && navigate(`/profile/${item.user_id}`)}
                >
                  {displayName}
                </p>
                {isFriend && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">Amigo</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: ptBR })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Badge variant="secondary" className={cn("gap-1 text-[10px] sm:text-xs", meta.badgeClass)}>
              <span>{meta.emoji}</span>
              <span className="hidden sm:inline">{meta.label}</span>
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {!isPost && (
                  <DropdownMenuItem onClick={openOriginal}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Abrir original
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={copyContent}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar texto
                </DropdownMenuItem>
                <DropdownMenuItem onClick={share}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Compartilhar
                </DropdownMenuItem>
                {isOwner && editableTarget ? (
                  <>
                    <DropdownMenuItem onClick={() => { setEditContent(item.content); setEditing(true); }}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDelete} disabled={deleting} className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      {deleting ? "Excluindo..." : "Excluir"}
                    </DropdownMenuItem>
                  </>
                ) : (
                  userId && item.user_id && item.user_id !== userId && (
                    <DropdownMenuItem onClick={() => setReportOpen(true)} className="text-destructive">
                      <Flag className="h-4 w-4 mr-2" />
                      Denunciar publicação
                    </DropdownMenuItem>
                  )
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Conteúdo */}
        {item.title && (
          <h3
            className={cn("text-lg font-semibold mb-1", !isPost && "cursor-pointer hover:text-primary")}
            onClick={!isPost ? openOriginal : undefined}
          >
            {item.title}
          </h3>
        )}
        {item.category && (
          <Badge variant="outline" className="mb-2 text-xs">{item.category}</Badge>
        )}
        {editing ? (
          <div className="mb-3 space-y-2">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSaveEdit} disabled={saving || !editContent.trim()}>
                {saving ? "Salvando..." : "Salvar"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        ) : item.content && (
          <div className="mb-3">
            <p className={cn("whitespace-pre-wrap text-sm sm:text-base", !expanded && longContent && "line-clamp-5")}>
              {item.content}
            </p>
            {longContent && (
              <button
                className="text-sm text-primary hover:underline mt-1 inline-flex items-center gap-1"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? <>Ver menos <ChevronUp className="h-3 w-3" /></> : <>Ver mais <ChevronDown className="h-3 w-3" /></>}
              </button>
            )}
          </div>
        )}

        {/* Mídia */}
        {item.media_url && (
          <div className="mb-3 rounded-lg overflow-hidden bg-muted">
            {item.media_type === 'video' ? (
              <video src={item.media_url} controls preload="metadata" className="w-full max-h-[500px] object-contain" />
            ) : (
              <ImageLightbox src={item.media_url} alt={item.title || "Imagem"} className="w-full max-h-[500px] object-contain" />
            )}
          </div>
        )}

        {/* Áudio */}
        {item.audio_url && (
          <div className="mb-3 flex items-center gap-2 p-2 rounded-lg bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20">
            <Play className="h-4 w-4 text-primary shrink-0" />
            <audio src={item.audio_url} controls preload="none" className="w-full h-9" />
          </div>
        )}

        {/* Ações */}
        <div className="flex items-center gap-1 flex-wrap text-muted-foreground border-t pt-2">
          {isPost ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLike}
              className={cn("gap-1.5", item.liked_by_me && "text-red-500")}
            >
              <Heart className={cn("h-4 w-4", item.liked_by_me && "fill-current")} />
              {item.likes_count || 0}
            </Button>
          ) : (
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={openOriginal}>
              <ExternalLink className="h-4 w-4" />
              <span className="hidden sm:inline">Abrir</span>
            </Button>
          )}

          <FeedReactionPicker item={item} userId={userId} onPatch={onPatch} />

          {isPost && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5"
              onClick={() => setShowComments(!showComments)}
            >
              <MessageCircle className="h-4 w-4" />
              {item.comments_count || 0}
            </Button>
          )}

          <Button variant="ghost" size="sm" className="gap-1.5" onClick={share}>
            <Share2 className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className={cn("gap-1.5 ml-auto", item.saved_by_me && "text-yellow-500")}
            onClick={toggleSave}
          >
            <Bookmark className={cn("h-4 w-4", item.saved_by_me && "fill-current")} />
          </Button>
        </div>

        {/* Comentários (posts nativos) */}
        {isPost && showComments && (
          <FeedComments
            postId={item.id}
            userId={userId}
            onCountChange={(delta) =>
              onPatch(item.key, (i) => ({ comments_count: (i.comments_count || 0) + delta }))
            }
          />
        )}
      </CardContent>

      {userId && item.user_id && (
        <ReportContentModal
          open={reportOpen}
          onOpenChange={setReportOpen}
          reporterId={userId}
          reportedUserId={item.user_id}
          contentType={item.type}
          contentId={item.id}
          contentSnippet={`[${meta.label}] ${item.title || item.content.slice(0, 100)}`}
        />
      )}
    </Card>
  );
};
