import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Users, Calendar, Lock } from "lucide-react";
import KingdomBadge, { BadgeRarity } from "./KingdomBadge";

const UNLOCK_LABELS: Record<string, string> = {
  manual: "Concedido manualmente pela equipe",
  donation: "Fazendo uma doação",
  first_donation: "Fazendo sua primeira doação",
  action_count: "Realizando uma quantidade de ações",
  streak: "Mantendo uma sequência de dias",
  streak_action: "Mantendo uma sequência em uma atividade",
  total_xp: "Acumulando XP na plataforma",
  event: "Participando de um evento especial",
  other: "Forma especial de conquista",
};

export interface BadgeDetail {
  name: string;
  description: string;
  rarity: BadgeRarity | string;
  rarityLabel: string;
  rarityColors?: { corInicio: string; corFim: string } | null;
  category: string;
  icon?: React.ReactNode;
  imageUrl?: string | null;
  emoji?: string;
  verseReference?: string | null;
  verseText?: string | null;
  unlockStory?: string | null;
  unlockType?: string | null;
  usersCount: number;
  createdAt: string;
  unlocked: boolean;
}

interface BadgeDetailModalProps {
  badge: BadgeDetail | null;
  onClose: () => void;
}

const BadgeDetailModal = ({ badge, onClose }: BadgeDetailModalProps) => {
  return (
    <Dialog open={!!badge} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md text-center">
        {badge && (
          <>
            <div className="flex justify-center my-2">
              <KingdomBadge
                rarity={badge.rarity}
                rarityColors={badge.rarityColors}
                icon={badge.unlocked ? badge.icon : undefined}
                imageUrl={badge.unlocked ? badge.imageUrl : undefined}
                emoji={badge.emoji}
                locked={!badge.unlocked}
                size="lg"
              />
            </div>

            <DialogHeader>
              <DialogTitle className="text-center">{badge.unlocked ? badge.name : "???"}</DialogTitle>
              <DialogDescription className="text-center">
                {badge.unlocked ? badge.description : "Continue participando para descobrir este selo."}
              </DialogDescription>
            </DialogHeader>

            <div className="flex items-center justify-center gap-2 text-xs">
              <span className="rounded-full border px-2 py-0.5" style={{ color: badge.rarityColors?.corInicio, borderColor: badge.rarityColors?.corInicio }}>
                {badge.rarityLabel}
              </span>
              <span className="rounded-full border px-2 py-0.5 text-muted-foreground">{badge.category}</span>
            </div>

            {badge.unlocked && badge.verseReference && (
              <div className="mt-3 rounded-lg bg-muted/50 p-3 text-sm">
                {badge.verseText && <p className="italic text-muted-foreground mb-1">"{badge.verseText}"</p>}
                <p className="text-xs font-medium text-amber-600 dark:text-amber-400">— {badge.verseReference}</p>
              </div>
            )}

            {badge.unlocked && badge.unlockStory && (
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{badge.unlockStory}</p>
            )}

            <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                {badge.unlocked ? <Users className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                {badge.unlocked ? `Como conquistar: ${UNLOCK_LABELS[badge.unlockType || "manual"] || "Especial"}` : "Bloqueado"}
              </span>
            </div>

            <div className="mt-2 flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {badge.usersCount} {badge.usersCount === 1 ? "pessoa possui" : "pessoas possuem"}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(badge.createdAt).toLocaleDateString("pt-BR")}
              </span>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BadgeDetailModal;
