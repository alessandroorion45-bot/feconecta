import { useState, useEffect } from "react";
import { UserPlus, Check, Share2, Gift } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface InviteButtonProps {
  className?: string;
}

// Recompensas (espelha a migration 20260727010000_referral_rewards.sql)
const REWARDS = [
  { threshold: 3, name: "Tema Clássico" },
  { threshold: 7, name: "Tema Reino Celestial" },
  { threshold: 15, name: "Tema Trono da Glória" },
];

/**
 * "Convide um irmão": gera um link de convite com ?ref=<userId>. Quem se
 * cadastrar por esse link fica registrado como indicado (profiles.referred_by).
 * Mostra o progresso de convites e a próxima recompensa (tema grátis).
 */
export const InviteButton = ({ className }: InviteButtonProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .rpc("get_my_referral_count")
      .then(({ data }) => {
        if (typeof data === "number") setCount(data);
      });
  }, [user]);

  if (!user) return null;

  const inviteUrl = `${window.location.origin}/auth?ref=${user.id}`;
  const shareText =
    "Vem caminhar comigo na Aliança Kingdom — uma comunidade cristã pra ler a Bíblia, orar e crescer na fé. 🙏";

  const nextReward = count !== null ? REWARDS.find((r) => count < r.threshold) : undefined;
  const remaining = nextReward ? nextReward.threshold - (count ?? 0) : 0;

  const handleInvite = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Aliança Kingdom", text: shareText, url: inviteUrl });
        return;
      } catch {
        // cancelou / não suportado — cai pro copiar
      }
    }
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast({ title: "Link de convite copiado! 🎉", description: "Cole no WhatsApp e chame um irmão." });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast({ title: "Seu link de convite", description: inviteUrl });
    }
  };

  return (
    <Card
      className={`overflow-hidden border-amber-200/70 dark:border-amber-800/40 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 ${className || ""}`}
    >
      <CardContent className="flex items-center gap-3 py-3">
        <div className="p-2.5 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white shrink-0">
          <UserPlus className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground leading-tight">Convide um irmão</p>
          {nextReward ? (
            <p className="text-xs text-muted-foreground leading-tight flex items-center gap-1">
              <Gift className="h-3 w-3 text-amber-500 shrink-0" />
              <span className="truncate">
                Falta{remaining > 1 ? "m" : ""} {remaining} pra ganhar o {nextReward.name}
              </span>
            </p>
          ) : count !== null && count > 0 ? (
            <p className="text-xs text-muted-foreground leading-tight">
              {count} convidados · todos os prêmios desbloqueados 🎉
            </p>
          ) : (
            <p className="text-xs text-muted-foreground leading-tight">
              Chame alguém e ganhe temas de presente.
            </p>
          )}
        </div>
        <Button
          size="sm"
          onClick={handleInvite}
          className="!bg-gradient-to-r !from-amber-500 !to-orange-500 !text-white shadow-sm shrink-0"
        >
          {copied ? <Check className="h-4 w-4 mr-1" /> : <Share2 className="h-4 w-4 mr-1" />}
          {copied ? "Copiado" : "Convidar"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default InviteButton;
