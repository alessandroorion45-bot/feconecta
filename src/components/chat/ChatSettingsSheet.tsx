import React from 'react';
import { cn } from '@/lib/utils';
import { Volume2, VolumeX, Palette, MessageSquare, Eye } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

interface ChatPreferences {
  sound_enabled: boolean;
  send_sound: string;
  receive_sound: string;
  theme: string;
  bubble_style: string;
  show_read_receipts?: boolean;
}

interface ChatSettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preferences: ChatPreferences;
  onUpdatePreferences: (updates: Partial<ChatPreferences>) => void;
}

const soundOptions = [
  { value: 'classic', label: 'Clássico' },
  { value: 'bubble', label: 'Bolha' },
  { value: 'chime', label: 'Sino' },
  { value: 'pop', label: 'Pop' },
  { value: 'whoosh', label: 'Swoosh' }
];

const themeOptions = [
  { value: 'auto', label: 'Automático (Horário)' },
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Escuro' },
  { value: 'sepia', label: 'Sépia' }
];

const bubbleOptions = [
  { value: 'modern', label: 'Moderno' },
  { value: 'classic', label: 'Clássico' },
  { value: 'minimal', label: 'Minimalista' }
];

export const ChatSettingsSheet: React.FC<ChatSettingsSheetProps> = ({
  open,
  onOpenChange,
  preferences,
  onUpdatePreferences
}) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[340px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Configurações do Chat
          </SheetTitle>
          <SheetDescription>
            Personalize sua experiência de chat com sons, temas e estilos únicos.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Sound Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
              {preferences.sound_enabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
              Sons
            </h3>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="sound-enabled">Sons ativados</Label>
              <Switch
                id="sound-enabled"
                checked={preferences.sound_enabled}
                onCheckedChange={(checked) => 
                  onUpdatePreferences({ sound_enabled: checked })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Som ao enviar</Label>
              <Select
                value={preferences.send_sound}
                onValueChange={(value) => 
                  onUpdatePreferences({ send_sound: value })
                }
                disabled={!preferences.sound_enabled}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {soundOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Som ao receber</Label>
              <Select
                value={preferences.receive_sound}
                onValueChange={(value) => 
                  onUpdatePreferences({ receive_sound: value })
                }
                disabled={!preferences.sound_enabled}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {soundOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Theme Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Tema
            </h3>

            <div className="space-y-2">
              <Label>Fundo do chat</Label>
              <Select
                value={preferences.theme}
                onValueChange={(value) => 
                  onUpdatePreferences({ theme: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {themeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bubble Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Estilo das Mensagens
            </h3>

            <div className="space-y-2">
              <Label>Estilo das bolhas</Label>
              <Select
                value={preferences.bubble_style}
                onValueChange={(value) => 
                  onUpdatePreferences({ bubble_style: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {bubbleOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Preview */}
            <div className="mt-4 p-4 rounded-lg bg-muted/50 space-y-2">
              <p className="text-xs text-muted-foreground mb-3">Pré-visualização:</p>
              <div className={cn(
                'max-w-[200px] px-3 py-2 rounded-2xl bg-primary text-primary-foreground text-sm',
                preferences.bubble_style === 'modern' && 'rounded-br-md',
                preferences.bubble_style === 'classic' && 'rounded-br-none',
                preferences.bubble_style === 'minimal' && 'rounded-br-sm'
              )}>
                Mensagem enviada ✨
              </div>
              <div className={cn(
                'max-w-[200px] px-3 py-2 rounded-2xl bg-muted text-foreground text-sm ml-auto',
                preferences.bubble_style === 'modern' && 'rounded-bl-md',
                preferences.bubble_style === 'classic' && 'rounded-bl-none',
                preferences.bubble_style === 'minimal' && 'rounded-bl-sm'
              )}>
                Mensagem recebida 💬
              </div>
            </div>
          </div>

          {/* Read Receipts */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Privacidade
            </h3>

            <div className="flex items-center justify-between">
              <Label htmlFor="read-receipts">Confirmação de leitura</Label>
              <Switch
                id="read-receipts"
                checked={preferences.show_read_receipts !== false}
                onCheckedChange={(checked) => 
                  onUpdatePreferences({ show_read_receipts: checked })
                }
              />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
