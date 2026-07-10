import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AvatarPro } from "@/components/AvatarPro";
import { useToast } from "@/hooks/use-toast";
import { Target, Trophy, Loader2, Plus, Check, Trash2 } from "lucide-react";
import { canCreateCampaign, canModerateMural } from "@/lib/communityRoles";
import { cn } from "@/lib/utils";

const sb = supabase as any;

interface Challenge {
  id: string;
  created_by: string;
  title: string;
  description: string | null;
  created_at: string;
}

interface CompletedUser {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
}

interface WeeklyChallengeCardProps {
  communityId: string;
  userId: string;
  myRole: string | null;
}

const WeeklyChallengeCard = ({ communityId, userId, myRole }: WeeklyChallengeCardProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [completed, setCompleted] = useState<CompletedUser[]>([]);
  const [iCompleted, setICompleted] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", description: "" });

  const load = useCallback(async () => {
    const { data: ch } = await sb
      .from("community_weekly_challenges")
      .select("*")
      .eq("community_id", communityId)
      .eq("is_pinned", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    setChallenge(ch || null);
    if (!ch) { setCompleted([]); setICompleted(false); setLoading(false); return; }

    const { data: rows } = await sb.from("community_challenge_completions").select("user_id").eq("challenge_id", ch.id);
    const ids = [...new Set((rows || []).map((r: any) => r.user_id))];
    setICompleted(ids.includes(userId));
    if (ids.length) {
      const { data: profiles } = await supabase.from("profiles").select("id, full_name, avatar_url").in("id", ids);
      setCompleted((profiles || []).map(p => ({ user_id: p.id, full_name: p.full_name || "Membro", avatar_url: p.avatar_url })));
    } else {
      setCompleted([]);
    }
    setLoading(false);
  }, [communityId, userId]);

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`weekly-challenge-${communityId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "community_weekly_challenges", filter: `community_id=eq.${communityId}` }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "community_challenge_completions" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [communityId, load]);

  const toggleComplete = async () => {
    if (!challenge) return;
    if (iCompleted) {
      await sb.from("community_challenge_completions").delete().eq("challenge_id", challenge.id).eq("user_id", userId);
    } else {
      await sb.from("community_challenge_completions").insert({ challenge_id: challenge.id, user_id: userId });
    }
    load();
  };

  const publish = async () => {
    if (!form.title.trim()) {
      toast({ title: "Dê um título ao desafio", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await sb.from("community_weekly_challenges").update({ is_pinned: false }).eq("community_id", communityId).eq("is_pinned", true);
      const { error } = await sb.from("community_weekly_challenges").insert({
        community_id: communityId, created_by: userId, title: form.title.trim(), description: form.description.trim() || null,
      });
      if (error) throw error;
      toast({ title: "🎯 Desafio da semana publicado!" });
      setForm({ title: "", description: "" });
      setShowForm(false);
      load();
    } catch (error: any) {
      toast({ title: "Erro ao publicar", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const removeChallenge = async () => {
    if (!challenge || !confirm("Remover o desafio da semana?")) return;
    await sb.from("community_weekly_challenges").delete().eq("id", challenge.id);
    load();
  };

  const canManage = canCreateCampaign(myRole) || canModerateMural(myRole);

  if (loading) return null;

  return (
    <>
      {challenge && (
        <Card className="border-emerald-400/30 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-emerald-500/5 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="h-5 w-5 text-emerald-600" />
                🎯 Desafio da Semana
              </CardTitle>
              {canManage && (
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={removeChallenge}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <h4 className="font-semibold">{challenge.title}</h4>
            {challenge.description && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{challenge.description}</p>}

            <Button
              size="sm"
              variant={iCompleted ? "default" : "outline"}
              className={cn("gap-2", iCompleted && "bg-emerald-600 hover:bg-emerald-700 text-white")}
              onClick={toggleComplete}
            >
              {iCompleted ? <Check className="h-4 w-4" /> : <Trophy className="h-4 w-4" />}
              {iCompleted ? "Concluído!" : "Marcar como concluído"}
            </Button>

            {completed.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                {completed.slice(0, 8).map(c => (
                  <AvatarPro key={c.user_id} src={c.avatar_url} name={c.full_name} size="xs" clickable={false} />
                ))}
                <span className="text-xs text-muted-foreground ml-1">{completed.length} concluíram</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {canManage && (
        <Button
          variant="outline"
          className="w-full border-emerald-400/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/5 gap-2"
          onClick={() => setShowForm(true)}
        >
          <Plus className="h-4 w-4" />
          {challenge ? "Novo desafio da semana" : "Publicar desafio da semana"}
        </Button>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Target className="h-5 w-5 text-emerald-600" /> Desafio da Semana</DialogTitle>
            <DialogDescription>Proponha uma ação prática pra comunidade viver essa semana.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Título *</Label>
              <Input placeholder="Ex: Convide um amigo pro culto" value={form.title} onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))} maxLength={120} />
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Textarea rows={3} placeholder="Detalhe o desafio..." value={form.description} onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))} className="resize-none" maxLength={500} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => setShowForm(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={publish} disabled={saving} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Target className="h-4 w-4" />}
              Publicar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WeeklyChallengeCard;
