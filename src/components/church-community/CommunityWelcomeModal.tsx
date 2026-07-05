import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { MINISTRIES } from "./MinistriesSelector";
import { Sparkles, ArrowRight, ArrowLeft, Check, Loader2, PartyPopper } from "lucide-react";
import { cn } from "@/lib/utils";

/** Formas de participação na igreja (Etapa 1) */
const PARTICIPATION_OPTIONS = [
  "🙋 Sou membro", "👋 Estou visitando", "🙏 Congregado", "📖 Novo convertido",
  "🌱 Em discipulado", "❤️ Voluntário", "👨‍👩‍👧 Líder de célula", "👨‍🏫 Professor",
  "🎵 Ministro de Louvor", "🎹 Músico", "🎤 Vocalista", "🙌 Diácono",
  "🤝 Diaconisa", "👑 Presbítero", "🕊️ Evangelista", "🔥 Missionário",
  "⛪ Pastor", "✝️ Pastora", "📚 Obreiro", "🍞 Recepção",
];

const TIME_OPTIONS = [
  "Menos de 3 meses", "3 a 6 meses", "6 meses a 1 ano",
  "1 a 3 anos", "3 a 5 anos", "Mais de 5 anos",
];

interface CommunityWelcomeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  communityId: string;
  communityName: string;
  userId: string;
  userName?: string;
  onJoined: () => void;
}

/**
 * Fluxo inteligente de entrada: antes de entrar, o novo membro informa
 * como participa da igreja — a Árvore da Comunidade e os ministérios
 * já nascem organizados.
 */
const CommunityWelcomeModal = ({
  open, onOpenChange, communityId, communityName, userId, userName, onJoined,
}: CommunityWelcomeModalProps) => {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [participation, setParticipation] = useState<string>("");
  const [customParticipation, setCustomParticipation] = useState("");
  const [ministries, setMinistries] = useState<string[]>([]);
  const [timeInChurch, setTimeInChurch] = useState<string>("");
  const [joining, setJoining] = useState(false);

  const TOTAL_STEPS = 4;
  const finalParticipation = participation === "outro"
    ? customParticipation.trim() || "Membro"
    : participation;

  const toggleMinistry = (id: string) =>
    setMinistries(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);

  const canAdvance =
    step === 1 ? (participation !== "" && (participation !== "outro" || customParticipation.trim())) :
    step === 3 ? timeInChurch !== "" :
    true;

  const join = async () => {
    setJoining(true);
    try {
      // Nome para a publicação de boas-vindas
      let displayName = userName;
      if (!displayName) {
        const { data: me } = await supabase
          .from("profiles").select("full_name").eq("id", userId).maybeSingle();
        displayName = me?.full_name || undefined;
      }

      const payload: any = {
        community_id: communityId,
        user_id: userId,
        role: "member",
        function_title: finalParticipation || null,
        ministries,
        time_in_church: timeInChurch || null,
      };

      let { error } = await (supabase as any).from("church_community_members").insert(payload);

      if (error && /time_in_church|column/i.test(error.message || "")) {
        // Coluna nova ainda não aplicada no banco — entra sem ela
        delete payload.time_in_church;
        ({ error } = await (supabase as any).from("church_community_members").insert(payload));
      }

      if (error && error.code !== "23505") throw error;

      // Publicação automática de boas-vindas no mural (melhor-esforço)
      try {
        await (supabase as any).from("community_posts").insert({
          community_id: communityId,
          user_id: userId,
          type: "announcement",
          title: "🎉 Novo irmão na comunidade!",
          content: `Vamos dar as boas-vindas a ${displayName || "um novo membro"}, que acaba de ingressar em nossa comunidade! Que Deus o abençoe nesta caminhada. 🙏`,
        });
      } catch { /* mural pode não estar disponível */ }

      toast({
        title: `✨ Bem-vindo(a) à ${communityName}!`,
        description: "Você já está na Árvore da Comunidade. Que alegria ter você conosco! 🎉",
      });
      onOpenChange(false);
      onJoined();
    } catch (error: any) {
      toast({ title: "Erro ao entrar", description: error.message, variant: "destructive" });
    } finally {
      setJoining(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            ✨ Seja bem-vindo(a) à Comunidade!
          </DialogTitle>
          <DialogDescription>
            {step === 1 && "Conte como você participa da igreja — isso organiza automaticamente a Árvore da Comunidade."}
            {step === 2 && "Você participa de algum ministério? (opcional)"}
            {step === 3 && "Há quanto tempo você congrega?"}
            {step === 4 && "Confira suas informações antes de entrar."}
          </DialogDescription>
        </DialogHeader>

        <Progress value={(step / TOTAL_STEPS) * 100} className="h-1.5" />

        <div className="max-h-[50vh] overflow-y-auto pr-2">
          {/* Etapa 1: participação */}
          {step === 1 && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                {PARTICIPATION_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    onClick={() => setParticipation(opt)}
                    className={cn(
                      "text-left text-sm rounded-lg border px-3 py-2 transition-colors",
                      participation === opt
                        ? "border-primary bg-primary/10 font-medium"
                        : "border-border hover:border-primary/40"
                    )}
                  >
                    {opt}
                  </button>
                ))}
                <button
                  onClick={() => setParticipation("outro")}
                  className={cn(
                    "text-left text-sm rounded-lg border px-3 py-2 transition-colors",
                    participation === "outro"
                      ? "border-primary bg-primary/10 font-medium"
                      : "border-border hover:border-primary/40"
                  )}
                >
                  ✏️ Outro
                </button>
              </div>
              {participation === "outro" && (
                <Input
                  placeholder="Descreva sua participação..."
                  value={customParticipation}
                  onChange={(e) => setCustomParticipation(e.target.value)}
                  maxLength={60}
                  autoFocus
                />
              )}
            </div>
          )}

          {/* Etapa 2: ministérios */}
          {step === 2 && (
            <div className="grid grid-cols-2 gap-2">
              {MINISTRIES.map(m => (
                <button
                  key={m.id}
                  onClick={() => toggleMinistry(m.id)}
                  className={cn(
                    "flex items-center gap-2 text-left text-sm rounded-lg border px-3 py-2 transition-colors",
                    ministries.includes(m.id)
                      ? "border-primary bg-primary/10 font-medium"
                      : "border-border hover:border-primary/40"
                  )}
                >
                  <span className={cn(
                    "h-3.5 w-3.5 shrink-0 rounded-sm border border-primary flex items-center justify-center",
                    ministries.includes(m.id) && "bg-primary text-primary-foreground"
                  )}>
                    {ministries.includes(m.id) && <Check className="h-2.5 w-2.5" />}
                  </span>
                  <span>{m.emoji}</span>
                  <span className="truncate">{m.name.replace("Ministério de ", "").replace("Ministério ", "")}</span>
                </button>
              ))}
            </div>
          )}

          {/* Etapa 3: tempo de igreja */}
          {step === 3 && (
            <div className="grid grid-cols-2 gap-2">
              {TIME_OPTIONS.map(opt => (
                <button
                  key={opt}
                  onClick={() => setTimeInChurch(opt)}
                  className={cn(
                    "text-sm rounded-lg border px-3 py-3 transition-colors",
                    timeInChurch === opt
                      ? "border-primary bg-primary/10 font-medium"
                      : "border-border hover:border-primary/40"
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          {/* Etapa 4: resumo */}
          {step === 4 && (
            <div className="space-y-3 text-sm">
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground mb-0.5">Sua participação</p>
                <p className="font-medium">{finalParticipation}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground mb-1">Ministérios</p>
                {ministries.length ? (
                  <div className="flex flex-wrap gap-1">
                    {ministries.map(id => {
                      const m = MINISTRIES.find(x => x.id === id);
                      return <Badge key={id} variant="secondary" className="text-xs">{m?.emoji} {m?.name.replace("Ministério de ", "")}</Badge>;
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Nenhum por enquanto</p>
                )}
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground mb-0.5">Tempo de igreja</p>
                <p className="font-medium">{timeInChurch}</p>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Você poderá editar tudo depois na aba Ministérios da comunidade.
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2 border-t">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={joining} className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          )}
          {step < TOTAL_STEPS ? (
            <Button onClick={() => setStep(s => s + 1)} disabled={!canAdvance} className="flex-1 gap-1">
              Continuar
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={join} disabled={joining} className="flex-1 gap-2 bg-gradient-to-r from-primary to-purple-600">
              {joining ? <Loader2 className="h-4 w-4 animate-spin" /> : <PartyPopper className="h-4 w-4" />}
              Entrar na Comunidade
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CommunityWelcomeModal;
