import { useState } from "react";
import { Share2, Check, Link2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ShareProfileButtonProps {
  userId: string;
  fullName?: string;
  className?: string;
}

/**
 * Botão "Compartilhar meu perfil" — gera o link público /profile/<id>.
 * Quem abrir sem conta vê a vitrine segura + convite pra se cadastrar.
 * Usa o compartilhamento nativo do celular; senão, copia o link.
 */
export const ShareProfileButton = ({ userId, fullName, className }: ShareProfileButtonProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  if (!userId) return null;

  const url = `${window.location.origin}/profile/${userId}`;
  const shareText = `Veja meu perfil na Aliança Kingdom 🙏 — vem caminhar comigo na fé!`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Aliança Kingdom", text: shareText, url });
        return;
      } catch {
        // cancelou / não suportado — cai pro copiar
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({ title: "Link do seu perfil copiado! 🔗", description: "Cole no WhatsApp ou Instagram e convide a galera." });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast({ title: "Seu link de perfil", description: url });
    }
  };

  return (
    <Card
      className={`overflow-hidden border-violet-200/70 dark:border-violet-800/40 bg-gradient-to-r from-violet-50 to-amber-50 dark:from-violet-950/30 dark:to-amber-950/20 ${className || ""}`}
    >
      <CardContent className="flex items-center gap-3 py-3">
        <div className="p-2.5 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white shrink-0">
          <Link2 className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground leading-tight">Compartilhar meu perfil</p>
          <p className="text-xs text-muted-foreground leading-tight">
            Convide amigos com o seu link — quem não tem conta vê uma prévia e se cadastra.
          </p>
        </div>
        <Button
          size="sm"
          onClick={handleShare}
          className="!bg-gradient-to-r !from-violet-500 !to-purple-600 !text-white shadow-sm shrink-0"
        >
          {copied ? <Check className="h-4 w-4 mr-1" /> : <Share2 className="h-4 w-4 mr-1" />}
          {copied ? "Copiado" : "Compartilhar"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ShareProfileButton;
