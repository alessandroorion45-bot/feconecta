import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CAMPAIGN_PRESETS, CAMPAIGN_EMOJI, canCreateCampaign } from "@/lib/communityRoles";
import { Flame, Plus, Loader2, Users, CheckCircle2, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

const sb = supabase as any;

interface Campaign {
  id: string;
  name: string;
  campaign_type: string;
  description: string | null;
  duration_days: number;
  start_date: string;
  is_active: boolean;
  created_by: string;
  participant_count: number;
  joined_by_me: boolean;
  my_checkins: number;
  checked_today: boolean;
}

interface CommunityCampaignsProps {
  communityId: string;
  userId: string;
  myRole: string | null;
}

/** Dia atual da campanha (1-based); 0 se ainda não começou */
function currentDay(startDate: string, durationDays: number): number {
  const start = new Date(`${startDate}T00:00:00`);
  const diff = Math.floor((Date.now() - start.getTime()) / 86_400_000) + 1;
  return Math.max(0, Math.min(diff, durationDays));
}

const CommunityCampaigns = ({ communityId, userId, myRole }: CommunityCampaignsProps) => {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsSql, setNeedsSql] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [preset, setPreset] = useState<string>(CAMPAIGN_PRESETS[0].type);
  const [customName, setCustomName] = useState("");
  const [description, setDescription] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await sb
      .from("community_campaigns")
      .select("*")
      .eq("community_id", communityId)
      .eq("is_active", true)
      .order("start_date", { ascending: false });

    if (error) {
      setNeedsSql(true);
      setLoading(false);
      return;
    }

    const list: any[] = data || [];
    if (list.length === 0) {
      setCampaigns([]);
      setLoading(false);
      return;
    }

    const ids = list.map(c => c.id);
    const [participantsRes, checkinsRes] = await Promise.all([
      sb.from("community_campaign_participants").select("campaign_id, user_id").in("campaign_id", ids),
      sb.from("community_campaign_checkins").select("campaign_id, user_id, day_number").in("campaign_id", ids).eq("user_id", userId),
    ]);

    const participants: any[] = participantsRes.data || [];
    const myCheckins: any[] = checkinsRes.data || [];

    setCampaigns(list.map(c => {
      const day = currentDay(c.start_date, c.duration_days);
      const mine = myCheckins.filter(k => k.campaign_id === c.id);
      return {
        ...c,
        participant_count: participants.filter(p => p.campaign_id === c.id).length,
        joined_by_me: participants.some(p => p.campaign_id === c.id && p.user_id === userId),
        my_checkins: mine.length,
        checked_today: mine.some(k => k.day_number === day),
      };
    }));
    setLoading(false);
  }, [communityId, userId]);

  useEffect(() => { load(); }, [load]);

  const createCampaign = async () => {
    const presetData = CAMPAIGN_PRESETS.find(p => p.type === preset);
    if (!presetData) return;
    const name = customName.trim() || presetData.name;

    setCreating(true);
    const { error } = await sb.from("community_campaigns").insert({
      community_id: communityId,
      created_by: userId,
      name,
      campaign_type: preset,
      description: description.trim() || null,
      duration_days: presetData.duration,
    });

    if (error) {
      toast({
        title: "Erro ao criar campanha",
        description: error.message?.includes("does not exist") || error.message?.includes("policy")
          ? "Aplique a atualização do banco (APLICAR_COMUNIDADE_SQL.sql) e confirme sua função de liderança."
          : error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "🔥 Campanha criada!", description: `"${name}" já está aberta para a comunidade.` });
      setCreateOpen(false);
      setCustomName("");
      setDescription("");
      load();
    }
    setCreating(false);
  };

  const joinCampaign = async (campaign: Campaign) => {
    setBusyId(campaign.id);
    const { error } = await sb.from("community_campaign_participants").insert({
      campaign_id: campaign.id,
      user_id: userId,
    });
    if (!error) {
      toast({ title: "Você entrou na campanha! 🙌", description: "Registre seu progresso todos os dias." });
      load();
    }
    setBusyId(null);
  };

  const checkIn = async (campaign: Campaign) => {
    const day = currentDay(campaign.start_date, campaign.duration_days);
    if (day < 1) {
      toast({ title: "A campanha ainda não começou", variant: "destructive" });
      return;
    }
    setBusyId(campaign.id);
    const { error } = await sb.from("community_campaign_checkins").insert({
      campaign_id: campaign.id,
      user_id: userId,
      day_number: day,
    });
    if (error) {
      if (error.code === "23505") {
        toast({ title: "Você já registrou hoje! ✅" });
      }
    } else {
      const done = campaign.my_checkins + 1;
      toast({
        title: done >= campaign.duration_days ? "🏆 Campanha concluída! Glória a Deus!" : `Dia ${day} registrado! 🔥`,
        description: done >= campaign.duration_days
          ? "Sua participação ficou registrada."
          : `${done}/${campaign.duration_days} dias completados`,
      });
      load();
    }
    setBusyId(null);
  };

  if (needsSql) {
    return (
      <Card className="text-center py-10">
        <CardContent>
          <Flame className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg mb-2">Campanhas quase prontas!</h3>
          <p className="text-muted-foreground">
            Aplique o arquivo <strong>APLICAR_COMUNIDADE_SQL.sql</strong> no SQL Editor do Supabase.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {canCreateCampaign(myRole) && (
        <Button onClick={() => setCreateOpen(true)} className="w-full gap-2">
          <Plus className="h-4 w-4" />
          Nova Campanha Espiritual
        </Button>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : campaigns.length === 0 ? (
        <Card className="text-center py-10">
          <CardContent>
            <Flame className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <p className="text-muted-foreground">
              Nenhuma campanha ativa. {canCreateCampaign(myRole) ? "Inicie a primeira!" : "Aguarde a liderança iniciar uma."}
            </p>
          </CardContent>
        </Card>
      ) : (
        campaigns.map(campaign => {
          const day = currentDay(campaign.start_date, campaign.duration_days);
          const myProgress = Math.round((campaign.my_checkins / campaign.duration_days) * 100);
          const completed = campaign.my_checkins >= campaign.duration_days;
          return (
            <Card key={campaign.id} className={cn(completed && "border-green-500/40 bg-green-500/5")}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span className="text-xl">{CAMPAIGN_EMOJI[campaign.campaign_type] || "🔥"}</span>
                    {campaign.name}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="gap-1">
                      <Users className="h-3 w-3" />
                      {campaign.participant_count}
                    </Badge>
                    <Badge variant="outline">
                      Dia {day}/{campaign.duration_days}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {campaign.description && (
                  <p className="text-sm text-muted-foreground">{campaign.description}</p>
                )}

                {campaign.joined_by_me && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Seu progresso</span>
                      <span className="font-medium">{campaign.my_checkins}/{campaign.duration_days} dias</span>
                    </div>
                    <Progress value={myProgress} className="h-2" />
                  </div>
                )}

                {completed ? (
                  <div className="flex items-center justify-center gap-2 py-2 text-green-600 dark:text-green-400 font-medium">
                    <Trophy className="h-5 w-5" />
                    Campanha concluída! Parabéns! 🎉
                  </div>
                ) : campaign.joined_by_me ? (
                  <Button
                    onClick={() => checkIn(campaign)}
                    disabled={busyId === campaign.id || campaign.checked_today || day < 1}
                    className={cn("w-full gap-2", campaign.checked_today && "bg-green-600 hover:bg-green-600")}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {campaign.checked_today ? "Dia de hoje registrado ✅" : `Registrar dia ${day}`}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => joinCampaign(campaign)}
                    disabled={busyId === campaign.id}
                    className="w-full gap-2"
                  >
                    <Flame className="h-4 w-4" />
                    Participar da Campanha
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })
      )}

      {/* Criar campanha */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              Nova Campanha Espiritual
            </DialogTitle>
            <DialogDescription>
              Convoque a comunidade para um propósito com Deus.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Modelo</Label>
              <Select value={preset} onValueChange={setPreset}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CAMPAIGN_PRESETS.map(p => (
                    <SelectItem key={p.type} value={p.type}>
                      <span className="flex items-center gap-2">
                        <span>{p.emoji}</span>
                        {p.name} ({p.duration} dias)
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="camp-name">Nome personalizado (opcional)</Label>
              <Input id="camp-name" placeholder="Deixe vazio para usar o nome do modelo"
                value={customName} onChange={(e) => setCustomName(e.target.value)} maxLength={80} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="camp-desc">Objetivo</Label>
              <Textarea id="camp-desc" placeholder="Qual o propósito desta campanha?"
                value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={500} className="resize-none" />
            </div>
            <Button onClick={createCampaign} disabled={creating} className="w-full gap-2">
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Flame className="h-4 w-4" />}
              Iniciar Campanha
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CommunityCampaigns;
