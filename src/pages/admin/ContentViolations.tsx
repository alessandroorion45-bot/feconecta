import { useCallback, useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAdminActions } from "@/hooks/useAdminActions";
import { ShieldAlert, AlertTriangle, Ban, Clock, Heart, Loader2, RefreshCw, MessageSquareWarning } from "lucide-react";

interface Violation {
  id: string;
  user_id: string;
  email?: string;
  name?: string;
  content?: string;
  words?: string[];
  offense?: number;
  severity?: string;
  action: string;
  when: string;
}
interface Status { user_id: string; punishment_type: string; expires_at: string | null; }

const REASON = (v: Violation) => `Linguagem imprópria ["${(v.words || []).join(", ")}"] — decisão manual do moderador`;

export default function ContentViolations() {
  const { toast } = useToast();
  const { warnUser, suspendUser, banUser } = useAdminActions();
  const [rows, setRows] = useState<Violation[]>([]);
  const [status, setStatus] = useState<Record<string, Status>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("auto_moderation_logs")
      .select("id, target_id, action_taken, trigger_data, executed_at, rule_name")
      .in("rule_name", ["Linguagem imprópria", "Palavras proibidas"])
      .order("executed_at", { ascending: false })
      .limit(100);

    const list: Violation[] = (data || []).map((r: any) => ({
      id: r.id,
      user_id: r.target_id,
      email: r.trigger_data?.email,
      name: r.trigger_data?.name,
      content: r.trigger_data?.content,
      words: r.trigger_data?.words,
      offense: r.trigger_data?.offense,
      severity: r.trigger_data?.severity,
      action: r.action_taken,
      when: r.executed_at,
    }));
    setRows(list);

    const ids = Array.from(new Set(list.map((v) => v.user_id).filter(Boolean)));
    if (ids.length) {
      const { data: st } = await supabase.rpc("get_users_punishment_status", { p_ids: ids });
      const map: Record<string, Status> = {};
      (st as Status[] | null)?.forEach((s) => { map[s.user_id] = s; });
      setStatus(map);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const doAction = async (v: Violation, kind: "warn" | "suspend" | "ban" | "pardon") => {
    if (kind === "ban" && !window.confirm(`Expulsar PERMANENTEMENTE ${v.name || "este usuário"}? Esta ação bane a conta.`)) return;
    setBusy(v.id + kind);
    let ok = false;
    if (kind === "warn") ok = await warnUser(v.user_id, REASON(v));
    else if (kind === "suspend") ok = await suspendUser(v.user_id, REASON(v), 7);
    else if (kind === "ban") ok = await banUser(v.user_id, REASON(v));
    else {
      const { data } = await supabase.rpc("clear_user_punishments", { p_user_id: v.user_id });
      ok = (data as any)?.ok === true;
    }
    setBusy(null);
    toast(ok
      ? { title: kind === "pardon" ? "🕊️ Restrições revogadas" : "Punição aplicada", description: v.name || v.email }
      : { title: "Não foi possível", description: "Tente novamente.", variant: "destructive" });
    if (ok) load();
  };

  const statusBadge = (uid: string) => {
    const s = status[uid];
    if (!s) return null;
    if (s.punishment_type === "ban") return <Badge variant="destructive" className="gap-1"><Ban className="h-3 w-3" />Banido</Badge>;
    return <Badge className="gap-1 bg-orange-500"><Clock className="h-3 w-3" />Suspenso</Badge>;
  };

  return (
    <AdminLayout>
      <AdminPageHeader
        title="Violações de Conteúdo"
        description="Quem usou linguagem imprópria/ódio — o que escreveu e as ações de punição. A expulsão permanente é sua decisão."
      />

      <div className="flex justify-end mb-3">
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-1.5" /> Atualizar
        </Button>
      </div>

      {loading ? (
        <div className="py-16 flex justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
      ) : rows.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">
          <ShieldAlert className="h-12 w-12 mx-auto mb-3 opacity-40" />
          Nenhuma violação registrada. A comunidade está em paz. 🕊️
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {rows.map((v) => (
            <Card key={v.id} className={v.offense && v.offense >= 2 ? "border-red-500/40" : "border-amber-500/30"}>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{v.name || "Usuário"}</span>
                      <span className="text-xs text-muted-foreground">{v.email || v.user_id}</span>
                      {statusBadge(v.user_id)}
                      <Badge variant="secondary" className="text-[10px]">ocorrência {v.offense ?? "?"}</Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {v.action === "warning" ? "auto: advertência" : "auto: suspensão"}
                      </Badge>
                    </div>
                    <div className="mt-2 rounded-lg bg-muted/50 px-3 py-2 text-sm">
                      <span className="text-muted-foreground">escreveu: </span>
                      <span className="text-foreground">"{v.content || "—"}"</span>
                    </div>
                    <p className="text-xs mt-1.5 flex items-center gap-1.5 text-red-600">
                      <MessageSquareWarning className="h-3.5 w-3.5" /> detectado: {(v.words || []).join(", ")}
                      <span className="text-muted-foreground ml-2">· {new Date(v.when).toLocaleString("pt-BR")}</span>
                    </p>
                  </div>
                </div>

                {/* Ações de punição (você decide) */}
                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
                  <Button size="sm" variant="outline" disabled={!!busy} onClick={() => doAction(v, "warn")}>
                    <AlertTriangle className="h-4 w-4 mr-1 text-amber-500" /> Advertir
                  </Button>
                  <Button size="sm" variant="outline" disabled={!!busy} onClick={() => doAction(v, "suspend")}>
                    <Clock className="h-4 w-4 mr-1 text-orange-500" /> Suspender 7 dias
                  </Button>
                  <Button size="sm" disabled={!!busy} onClick={() => doAction(v, "ban")}
                    className="!bg-gradient-to-r !from-red-600 !to-rose-700 !text-white">
                    <Ban className="h-4 w-4 mr-1" /> Expulsar permanente
                  </Button>
                  <Button size="sm" variant="ghost" disabled={!!busy} onClick={() => doAction(v, "pardon")} className="text-emerald-600">
                    <Heart className="h-4 w-4 mr-1" /> Perdoar
                  </Button>
                  {busy?.startsWith(v.id) && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground self-center" />}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
