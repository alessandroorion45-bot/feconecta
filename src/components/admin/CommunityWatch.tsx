import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import UserAvatar from "@/components/UserAvatar";
import { useAdminActions } from "@/hooks/useAdminActions";
import { useToast } from "@/hooks/use-toast";
import {
  Users, MessageSquare, HandHeart, BookOpen, Flag, Activity,
  UserPlus, EyeOff, RefreshCw, Radio, AlertTriangle, Clock, Ban, Loader2,
} from "lucide-react";

// ---- tipos ----
type Kind = "post" | "testimony" | "prayer" | "member";
interface Item {
  id: string;
  kind: Kind;
  userId: string | null;
  text: string;
  createdAt: string;
  hidden?: boolean;
}
interface ProfileLite { id: string; full_name: string | null; username: string | null; avatar_url: string | null; }

const AGO = (iso: string) => {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "agora";
  if (s < 3600) return `há ${Math.floor(s / 60)} min`;
  if (s < 86400) return `há ${Math.floor(s / 3600)} h`;
  return `há ${Math.floor(s / 86400)} d`;
};

const KIND = {
  post:      { icon: MessageSquare, color: "text-sky-500",     bg: "bg-sky-500/10",     label: "publicou" },
  testimony: { icon: BookOpen,      color: "text-amber-500",   bg: "bg-amber-500/10",   label: "testemunho" },
  prayer:    { icon: HandHeart,     color: "text-violet-500",  bg: "bg-violet-500/10",  label: "pediu oração" },
  member:    { icon: UserPlus,      color: "text-emerald-500", bg: "bg-emerald-500/10", label: "entrou" },
} as const;

const snip = (t: string | null, n = 90) => {
  const s = (t || "").replace(/\s+/g, " ").trim();
  return s.length > n ? s.slice(0, n) + "…" : s || "—";
};

/**
 * Painel de vigilância da comunidade (só leitura, só conteúdo público):
 * termômetro das últimas 24h + mural ao vivo do que está acontecendo.
 * Atualiza sozinho a cada 25s. NÃO acessa mensagens privadas — vigilância
 * é pra proteger contra abuso, não pra bisbilhotar a intimidade.
 */
export const CommunityWatch = () => {
  const { toast } = useToast();
  const { warnUser, suspendUser, banUser } = useAdminActions();
  const [busy, setBusy] = useState<string | null>(null);
  const [punished, setPunished] = useState<Record<string, string>>({});
  const [health, setHealth] = useState({ membros: 0, posts: 0, testemunhos: 0, oracoes: 0, denuncias: 0 });
  const [items, setItems] = useState<Item[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileLite>>({});
  const [pulse, setPulse] = useState(false);
  const firstLoad = useRef(true);

  const load = useCallback(async () => {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const head = { count: "exact" as const, head: true };

    const [mem, po, te, or, de, recentPosts, recentTest, recentPray, newMembers] = await Promise.all([
      supabase.from("profiles").select("*", head).gte("created_at", since),
      supabase.from("posts").select("*", head).gte("created_at", since),
      supabase.from("testimonies").select("*", head).gte("created_at", since),
      supabase.from("prayers").select("*", head).gte("created_at", since),
      supabase.from("user_reports").select("*", head).is("resolved_at", null),
      supabase.from("posts").select("id, content, user_id, created_at, is_hidden").order("created_at", { ascending: false }).limit(12),
      supabase.from("testimonies").select("id, title, user_id, created_at").order("created_at", { ascending: false }).limit(6),
      supabase.from("prayers").select("id, title, user_id, created_at").order("created_at", { ascending: false }).limit(6),
      supabase.from("profiles").select("id, full_name, username, avatar_url, created_at").order("created_at", { ascending: false }).limit(8),
    ]);

    setHealth({
      membros: mem.count || 0,
      posts: po.count || 0,
      testemunhos: te.count || 0,
      oracoes: or.count || 0,
      denuncias: de.count || 0,
    });

    const merged: Item[] = [
      ...(recentPosts.data || []).map((p: { id: string; content: string; user_id: string; created_at: string; is_hidden: boolean }) =>
        ({ id: "po" + p.id, kind: "post" as Kind, userId: p.user_id, text: snip(p.content), createdAt: p.created_at, hidden: p.is_hidden })),
      ...(recentTest.data || []).map((t: { id: string; title: string; user_id: string; created_at: string }) =>
        ({ id: "te" + t.id, kind: "testimony" as Kind, userId: t.user_id, text: snip(t.title, 70), createdAt: t.created_at })),
      ...(recentPray.data || []).map((p: { id: string; title: string; user_id: string; created_at: string }) =>
        ({ id: "pr" + p.id, kind: "prayer" as Kind, userId: p.user_id, text: snip(p.title, 70), createdAt: p.created_at })),
      ...(newMembers.data || []).map((m: { id: string; created_at: string }) =>
        ({ id: "me" + m.id, kind: "member" as Kind, userId: m.id, text: "entrou na comunidade", createdAt: m.created_at })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 18);

    // nomes/avatares dos autores
    const ids = Array.from(new Set(merged.map((i) => i.userId).filter(Boolean))) as string[];
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id, full_name, username, avatar_url").in("id", ids);
      const map: Record<string, ProfileLite> = {};
      (profs || []).forEach((p: ProfileLite) => { map[p.id] = p; });
      setProfiles(map);

      // quem já está suspenso/banido (pra marcar no mural)
      const { data: st } = await supabase.rpc("get_users_punishment_status", { p_ids: ids });
      const pmap: Record<string, string> = {};
      (st as { user_id: string; punishment_type: string }[] | null)?.forEach((s) => {
        pmap[s.user_id] = s.punishment_type;
      });
      setPunished(pmap);
    }

    setItems(merged);
    if (!firstLoad.current) { setPulse(true); setTimeout(() => setPulse(false), 700); }
    firstLoad.current = false;
  }, []);

  /**
   * Punir direto do mural: o admin vê a infração e age ali mesmo, sem ter
   * que procurar a pessoa em outra tela. Suspensão/expulsão pedem confirmação
   * (a expulsão permanente é decisão manual do dono, nunca automática).
   */
  const punir = async (item: Item, name: string, kind: "warn" | "suspend" | "ban") => {
    if (!item.userId) return;
    const motivo =
      item.kind === "member"
        ? "Conduta inadequada na comunidade — revisado pelo Olho da Vigilância"
        : `Conteúdo impróprio (${KIND[item.kind].label}): "${snip(item.text, 60)}"`;

    if (kind === "suspend" && !window.confirm(`Suspender ${name} por 7 dias?\n\nMotivo: ${motivo}`)) return;
    if (kind === "ban" && !window.confirm(`EXPULSAR ${name} PERMANENTEMENTE?\n\nEsta ação bane a conta.\nMotivo: ${motivo}`)) return;

    setBusy(item.id + kind);
    const ok =
      kind === "warn" ? await warnUser(item.userId, motivo)
      : kind === "suspend" ? await suspendUser(item.userId, motivo, 7)
      : await banUser(item.userId, motivo);
    setBusy(null);

    if (ok) {
      setPunished((p) => ({ ...p, [item.userId!]: kind === "ban" ? "ban" : kind === "suspend" ? "suspension" : "warning" }));
      toast({
        title: kind === "warn" ? "⚠️ Advertência enviada" : kind === "suspend" ? "⏳ Suspenso por 7 dias" : "🚫 Expulso permanentemente",
        description: name,
      });
    } else {
      toast({ title: "Não foi possível aplicar", description: "Tente novamente.", variant: "destructive" });
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 25000);
    return () => clearInterval(t);
  }, [load]);

  const stat = (icon: React.ReactNode, n: number, label: string, tone: string) => (
    <Card><CardContent className="flex items-center gap-3 p-4">
      <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${tone}`}>{icon}</div>
      <div><p className="text-2xl font-bold tabular-nums">{n}</p><p className="text-xs text-muted-foreground">{label}</p></div>
    </CardContent></Card>
  );

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <Radio className={`h-4 w-4 text-emerald-500 ${pulse ? "animate-ping" : ""}`} />
        <h2 className="font-bold">Termômetro da Comunidade</h2>
        <span className="text-xs text-muted-foreground">· últimas 24h · atualiza sozinho</span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {stat(<Users className="h-5 w-5 text-emerald-600" />, health.membros, "Novos membros", "bg-emerald-500/10")}
        {stat(<MessageSquare className="h-5 w-5 text-sky-600" />, health.posts, "Publicações", "bg-sky-500/10")}
        {stat(<BookOpen className="h-5 w-5 text-amber-600" />, health.testemunhos, "Testemunhos", "bg-amber-500/10")}
        {stat(<HandHeart className="h-5 w-5 text-violet-600" />, health.oracoes, "Orações", "bg-violet-500/10")}
        {stat(<Flag className={`h-5 w-5 ${health.denuncias > 0 ? "text-red-600" : "text-muted-foreground"}`} />, health.denuncias, "Denúncias abertas", health.denuncias > 0 ? "bg-red-500/10" : "bg-muted")}
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">Mural ao Vivo</h3>
            <RefreshCw className="h-3 w-3 text-muted-foreground ml-auto" />
          </div>
          <div className="space-y-1 max-h-[440px] overflow-y-auto">
            {items.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">Tudo tranquilo por aqui. 🕊️</p>
            ) : items.map((it) => {
              const K = KIND[it.kind];
              const prof = it.userId ? profiles[it.userId] : undefined;
              const name = prof?.full_name || prof?.username || "Alguém";
              return (
                <div key={it.id} className="group flex items-start gap-3 py-2 px-2 rounded-lg hover:bg-accent/5 transition-colors">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full ${K.bg} shrink-0 mt-0.5`}>
                    <K.icon className={`h-4 w-4 ${K.color}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-snug">
                      <span className="font-medium">{name}</span>{" "}
                      <span className="text-muted-foreground">{it.kind === "member" ? it.text : `${K.label}:`}</span>{" "}
                      {it.kind !== "member" && <span className="text-foreground/80">"{it.text}"</span>}
                      {it.hidden && <Badge variant="destructive" className="ml-2 text-[10px] gap-1"><EyeOff className="h-2.5 w-2.5" />oculto</Badge>}
                      {punished[it.userId || ""] === "ban" && <Badge variant="destructive" className="ml-2 text-[10px] gap-1"><Ban className="h-2.5 w-2.5" />banido</Badge>}
                      {punished[it.userId || ""] === "suspension" && <Badge className="ml-2 text-[10px] gap-1 bg-orange-500"><Clock className="h-2.5 w-2.5" />suspenso</Badge>}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{AGO(it.createdAt)}</p>

                    {/* Punir na hora — aparece ao passar o mouse (sempre visível no toque) */}
                    {it.userId && (
                      <div className="mt-1.5 flex flex-wrap items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 max-sm:opacity-100 transition-opacity">
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-[11px] text-amber-600 hover:bg-amber-500/10"
                          disabled={!!busy} onClick={() => punir(it, name, "warn")}>
                          {busy === it.id + "warn" ? <Loader2 className="h-3 w-3 animate-spin" /> : <AlertTriangle className="h-3 w-3 mr-1" />}
                          Advertir
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-[11px] text-orange-600 hover:bg-orange-500/10"
                          disabled={!!busy} onClick={() => punir(it, name, "suspend")}>
                          {busy === it.id + "suspend" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Clock className="h-3 w-3 mr-1" />}
                          Suspender 7d
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-[11px] text-red-600 hover:bg-red-500/10"
                          disabled={!!busy} onClick={() => punir(it, name, "ban")}>
                          {busy === it.id + "ban" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Ban className="h-3 w-3 mr-1" />}
                          Expulsar
                        </Button>
                      </div>
                    )}
                  </div>
                  {prof && <UserAvatar src={prof.avatar_url || undefined} fallback={name} className="h-7 w-7 shrink-0" />}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CommunityWatch;
