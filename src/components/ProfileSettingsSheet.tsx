import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Settings, Lock, Unlock, Bell, Eye, Shield, Save, ShieldBan, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BlockedUsersManager } from "@/components/BlockedUsersManager";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ProfileSettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  isPrivate: boolean;
  onPrivacyUpdate: (isPrivate: boolean) => void;
}

export const ProfileSettingsSheet = ({
  open,
  onOpenChange,
  userId,
  isPrivate,
  onPrivacyUpdate,
}: ProfileSettingsSheetProps) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [blockedOpen, setBlockedOpen] = useState(false);
  const [settings, setSettings] = useState({
    isPrivate: isPrivate,
    showMaritalStatus: true,
    emailNotifications: true,
    pushNotifications: true,
  });

  useEffect(() => {
    setSettings((prev) => ({ ...prev, isPrivate }));
  }, [isPrivate, open]);

  const handleSavePrivacy = async () => {
    try {
      setSaving(true);

      const { error } = await supabase
        .from("profiles")
        .update({ is_private: settings.isPrivate })
        .eq("id", userId);

      if (error) throw error;

      onPrivacyUpdate(settings.isPrivate);
      
      toast({
        title: "Configurações salvas!",
        description: settings.isPrivate
          ? "Seu perfil agora é privado."
          : "Seu perfil agora é público.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-xl font-bold flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações
          </SheetTitle>
          <SheetDescription>
            Gerencie suas preferências de privacidade e notificações.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          {/* Privacy Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Privacidade do Perfil</h3>
            </div>

            <div className="rounded-lg border p-4 space-y-4 bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="privacy-toggle" className="flex items-center gap-2 cursor-pointer">
                    {settings.isPrivate ? (
                      <Lock className="h-4 w-4 text-amber-500" />
                    ) : (
                      <Unlock className="h-4 w-4 text-emerald-500" />
                    )}
                    <span className="font-medium">
                      {settings.isPrivate ? "Perfil Privado" : "Perfil Público"}
                    </span>
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {settings.isPrivate
                      ? "Apenas amigos podem ver seu perfil completo e fotos."
                      : "Qualquer pessoa pode visitar e ver seu perfil."}
                  </p>
                </div>
                <Switch
                  id="privacy-toggle"
                  checked={settings.isPrivate}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, isPrivate: checked })
                  }
                />
              </div>

              {settings.isPrivate !== isPrivate && (
                <Button
                  onClick={handleSavePrivacy}
                  disabled={saving}
                  size="sm"
                  className="w-full gap-2"
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Salvando..." : "Salvar Privacidade"}
                </Button>
              )}
            </div>
          </div>

          <Separator />

          {/* Blocked Users Section */}
          <Collapsible open={blockedOpen} onOpenChange={setBlockedOpen}>
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between cursor-pointer group p-2 -m-2 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2">
                  <ShieldBan className="h-5 w-5 text-destructive" />
                  <h3 className="font-semibold">Usuários Bloqueados</h3>
                </div>
                <ChevronRight className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${blockedOpen ? 'rotate-90' : ''}`} />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <BlockedUsersManager currentUserId={userId} />
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Display Preferences */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Preferências de Exibição</h3>
            </div>

            <div className="rounded-lg border p-4 space-y-4 bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="show-marital" className="cursor-pointer font-medium">
                    Exibir Estado Civil
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Mostrar seu estado civil no perfil público.
                  </p>
                </div>
                <Switch
                  id="show-marital"
                  checked={settings.showMaritalStatus}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, showMaritalStatus: checked })
                  }
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Notifications */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Notificações</h3>
            </div>

            <div className="rounded-lg border p-4 space-y-4 bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="email-notif" className="cursor-pointer font-medium">
                    Notificações por E-mail
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receber atualizações importantes por e-mail.
                  </p>
                </div>
                <Switch
                  id="email-notif"
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, emailNotifications: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="push-notif" className="cursor-pointer font-medium">
                    Notificações Push
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receber alertas em tempo real no navegador.
                  </p>
                </div>
                <Switch
                  id="push-notif"
                  checked={settings.pushNotifications}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, pushNotifications: checked })
                  }
                />
              </div>
            </div>
          </div>

          {/* Account Section */}
          <Separator />

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Conta e Segurança</h3>
            </div>

            <div className="rounded-lg border p-4 bg-muted/30">
              <p className="text-sm text-muted-foreground mb-3">
                Gerencie seu e-mail, senha e configurações de segurança da conta.
              </p>
              <Button variant="outline" size="sm" className="w-full" disabled>
                Em breve
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
