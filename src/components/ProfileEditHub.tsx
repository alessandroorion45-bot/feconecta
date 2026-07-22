// =====================================================
// PROFILE EDIT HUB — menu de atalhos do "Editar Perfil"
// =====================================================
// Um único botão abre este bottom sheet com todos os
// atalhos de gerenciamento do perfil, em vez de espalhar
// vários botões pela tela. Cada item aciona uma ação que
// já existia antes (sheets/dialogs/rotas) — nada de novo
// foi construído por baixo, só a "porta de entrada" única.
// =====================================================

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Pencil, ImageIcon, Camera, Video, Palette, Shield, ChevronRight } from "lucide-react";

interface HubAction {
  icon: React.ElementType;
  label: string;
  description: string;
  onClick: () => void;
  accent: string;
}

interface ProfileEditHubProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditInfo: () => void;
  onChangeAvatar: () => void;
  onAddPhotos: () => void;
  onAddVideo: () => void;
  onChangeTheme: () => void;
  onPrivacy: () => void;
}

export const ProfileEditHub = ({
  open,
  onOpenChange,
  onEditInfo,
  onChangeAvatar,
  onAddPhotos,
  onAddVideo,
  onChangeTheme,
  onPrivacy,
}: ProfileEditHubProps) => {
  const run = (fn: () => void) => {
    onOpenChange(false);
    // deixa o sheet começar a fechar antes de abrir o próximo (evita
    // a mesma corrida de foco/transição já vista em outros modais do app)
    setTimeout(fn, 0);
  };

  const actions: HubAction[] = [
    {
      icon: Pencil,
      label: "Editar informações",
      description: "Nome, bio, igreja, frase de perfil e mais",
      onClick: () => run(onEditInfo),
      accent: "text-primary",
    },
    {
      icon: Camera,
      label: "Alterar foto de perfil",
      description: "Escolha uma nova foto de rosto",
      onClick: () => run(onChangeAvatar),
      accent: "text-sky-500",
    },
    {
      icon: ImageIcon,
      label: "Alterar capa",
      description: "A imagem do topo do seu perfil",
      onClick: () => run(onEditInfo),
      accent: "text-violet-500",
    },
    {
      icon: ImageIcon,
      label: "Adicionar fotos",
      description: "Publique novas fotos no seu álbum",
      onClick: () => run(onAddPhotos),
      accent: "text-emerald-500",
    },
    {
      icon: Video,
      label: "Publicar vídeo",
      description: "Compartilhe um momento em vídeo",
      onClick: () => run(onAddVideo),
      accent: "text-rose-500",
    },
    {
      icon: Palette,
      label: "Alterar tema",
      description: "Personalize as cores e a atmosfera do app",
      onClick: () => run(onChangeTheme),
      accent: "text-amber-500",
    },
    {
      icon: Shield,
      label: "Privacidade",
      description: "Quem pode ver seu perfil e conteúdo",
      onClick: () => run(onPrivacy),
      accent: "text-slate-500",
    },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto pb-8">
        <SheetHeader className="text-left mb-2">
          <SheetTitle className="flex items-center gap-2">
            <Pencil className="h-4 w-4" />
            Gerenciar Perfil
          </SheetTitle>
          <SheetDescription>Escolha o que você quer atualizar.</SheetDescription>
        </SheetHeader>

        <div className="mt-2 divide-y divide-border/60">
          {actions.map((action) => (
            <button
              key={action.label}
              onClick={action.onClick}
              className="group flex w-full items-center gap-3 py-3 text-left transition-colors hover:bg-muted/50 -mx-1 px-1 rounded-lg"
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted transition-transform duration-200 group-hover:scale-105 ${action.accent}`}>
                <action.icon className="h-[18px] w-[18px]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{action.label}</p>
                <p className="text-xs text-muted-foreground">{action.description}</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform duration-200 group-hover:translate-x-0.5" />
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ProfileEditHub;
