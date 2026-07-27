import { useState } from "react";
import { UserPlus, Check, Share2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface InviteButtonProps {
  className?: string;
}

/**
 * "Convide um irmão": gera um link de convite com ?ref=<userId>. Quem se
 * cadastrar por esse link fica registrado como indicado (profiles.referred_by),
 * via metadata no cadastro. Usa o compartilhamento nativo do celular quando
 * disponível; senão copia o link.
 */
export const InviteButton = ({ className }: InviteButtonProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  if (!user) return null;

  const inviteUrl = `${window.location.origin}/auth?ref=${user.id}`;
  const shareText =
    "Vem caminhar comigo na Aliança Kingdom — uma comunidade cristã pra ler a Bíblia, orar e crescer na fé. 🙏";

  const handleInvite = async () => {
    // Compartilhamento nativo (celular)
    if (navigator.share) {
      try {
        await navigator.share({ title: "Aliança Kingdom", text: shareText, url: inviteUrl });
        return;
      } catch {
        // usuário cancelou ou não suportado — cai pro copiar
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
          <p className="text-xs text-muted-foreground leading-tight">
            Chame alguém pra caminhar com você na fé.
          </p>
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
