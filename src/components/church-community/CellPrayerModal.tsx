import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AvatarPro } from "@/components/AvatarPro";
import { useToast } from "@/hooks/use-toast";
import { HandHeart, Loader2, Send, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { notifyCellMembers } from "@/lib/communityNotifications";

const sb = supabase as any;

const TYPE_INFO: Record<string, { label: string; emoji: string }> = {
  request: { label: "Pedido de Oração", emoji: "🙏" },
  testimony: { label: "Testemunho", emoji: "❤️" },
  thanks: { label: "Agradecimento", emoji: "🌻" },
  answered: { label: "Resposta de Oração", emoji: "✨" },
};

interface PrayerRequest {
  id: string;
  user_id: string;
  type: string;
  content: string;
  created_at: string;
  full_name?: string;
  avatar_url?: string | null;
  prayed_count: number;
  i_prayed: boolean;
}

interface CellPrayerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cellId: string;
  communityId: string;
  userId: string;
  canModerate: boolean;
}

const CellPrayerModal = ({ open, onOpenChange, cellId, communityId, userId, canModerate }: CellPrayerModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<PrayerRequest[]>([]);
  const [type, setType] = useState("request");
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);

  const load = useCallback(async () => {
    const { data } = await sb
      .from("community_cell_prayer_requests")
      .select("*")
      .eq("cell_id", cellId)
      .order("created_at", { ascending: false });

    const list: any[] = data || [];
    if (!list.length) { setRequests([]); setLoading(false); return; }

    const ids = [...new Set(list.map(r => r.user_id))];
    const [{ data: profiles }, { data: intercessions }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, avatar_url").in("id", ids),
      sb.from("community_cell_prayer_intercessions").select("request_id, user_id").in("request_id", list.map(r => r.id)),
    ]);
    const pMap = new Map((profiles || []).map((p: any) => [p.id, p]));
    const countMap = new Map<string, number>();
    const mine = new Set<string>();
    (intercessions || []).forEach((i: any) => {
      countMap.set(i.request_id, (countMap.get(i.request_id) || 0) + 1);
      if (i.user_id === userId) mine.add(i.request_id);
    });

    setRequests(list.map(r => ({
      ...r,
      full_name: pMap.get(r.user_id)?.full_name || "Membro",
      avatar_url: pMap.get(r.user_id)?.avatar_url || null,
      prayed_count: countMap.get(r.id) || 0,
      i_prayed: mine.has(r.id),
    })));
    setLoading(false);
  }, [cellId, userId]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    load();
    const channel = supabase
      .channel(`cell-prayers-${cellId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "community_cell_prayer_requests", filter: `cell_id=eq.${cellId}` }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "community_cell_prayer_intercessions" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [open, cellId, load]);

  const post = async () => {
    if (!content.trim()) return;
    setPosting(true);
    try {
      const { error } = await sb.from("community_cell_prayer_requests").insert({
        cell_id: cellId, community_id: communityId, user_id: userId, type, content: content.trim(),
      });
      if (error) throw error;
      notifyCellMembers(cellId, userId, "cell_prayer_request", `${TYPE_INFO[type]?.emoji} Novo ${TYPE_INFO[type]?.label.toLowerCase()} na célula`, communityId);
      setContent("");
      toast({ title: "Publicado! 🙏" });
    } catch (error: any) {
      toast({ title: "Erro ao publicar", description: error.message, variant: "destructive" });
    } finally {
      setPosting(false);
    }
  };

  const togglePray = async (r: PrayerRequest) => {
    if (r.i_prayed) {
      await sb.from("community_cell_prayer_intercessions").delete().eq("request_id", r.id).eq("user_id", userId);
    } else {
      await sb.from("community_cell_prayer_intercessions").insert({ request_id: r.id, user_id: userId });
    }
    load();
  };

  const remove = async (r: PrayerRequest) => {
    if (!confirm("Remover esta publicação?")) return;
    const { error } = await sb.from("community_cell_prayer_requests").delete().eq("id", r.id);
    if (error) {
      toast({ title: "Erro ao remover", description: error.message, variant: "destructive" });
      return;
    }
    load();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg">
              <HandHeart className="h-5 w-5 text-white" />
            </div>
            <DialogTitle>Pedidos de Oração da Célula</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-3 border-b pb-3">
          <div className="flex gap-2">
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(TYPE_INFO).map(([value, info]) => (
                  <SelectItem key={value} value={value}>{info.emoji} {info.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Textarea placeholder="Compartilhe com sua célula..." rows={2} value={content} onChange={(e) => setContent(e.target.value)} className="resize-none" />
          <Button onClick={post} disabled={posting || !content.trim()} className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white">
            {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Publicar
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : requests.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Nenhuma publicação ainda. Seja o primeiro a compartilhar!</p>
        ) : (
          <div className="space-y-3">
            {requests.map(r => (
              <div key={r.id} className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <AvatarPro src={r.avatar_url} name={r.full_name} size="xs" clickable={false} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{r.full_name}</p>
                    <p className="text-[11px] text-muted-foreground">{formatDistanceToNow(new Date(r.created_at), { addSuffix: true, locale: ptBR })}</p>
                  </div>
                  <Badge variant="secondary" className="text-[10px] gap-1 shrink-0">{TYPE_INFO[r.type]?.emoji} {TYPE_INFO[r.type]?.label}</Badge>
                  {(r.user_id === userId || canModerate) && (
                    <button type="button" onClick={() => remove(r)} className="text-muted-foreground hover:text-destructive shrink-0">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-sm whitespace-pre-wrap">{r.content}</p>
                <Button
                  size="sm" variant="ghost"
                  className={cn("h-7 text-xs gap-1.5", r.i_prayed && "text-primary")}
                  onClick={() => togglePray(r)}
                >
                  🙏 {r.i_prayed ? "Orei por isso" : "Orar por isso"} ({r.prayed_count})
                </Button>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CellPrayerModal;
