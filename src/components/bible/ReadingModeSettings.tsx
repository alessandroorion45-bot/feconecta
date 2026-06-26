import { Settings, Type, AlignLeft, Sun, Moon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface ReadingModeConfig {
  fontSize: number;
  lineHeight: number;
  maxWidth: number;
  fontFamily: 'serif' | 'sans' | 'mono';
  theme: 'light' | 'dark' | 'sepia';
  focusMode: boolean;
}

interface ReadingModeSettingsProps {
  config: ReadingModeConfig;
  onChange: (config: ReadingModeConfig) => void;
}

export const ReadingModeSettings = ({ config, onChange }: ReadingModeSettingsProps) => {
  const updateConfig = (updates: Partial<ReadingModeConfig>) => {
    onChange({ ...config, ...updates });
  };

  return (
    <Card className="theme-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Settings className="h-5 w-5" />
          Modo Leitura
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tamanho da Fonte */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              Tamanho da Fonte
            </Label>
            <span className="text-sm text-muted-foreground">{config.fontSize}px</span>
          </div>
          <Slider
            value={[config.fontSize]}
            onValueChange={([value]) => updateConfig({ fontSize: value })}
            min={14}
            max={32}
            step={2}
            className="w-full"
          />
        </div>

        {/* Espaçamento entre Linhas */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <AlignLeft className="h-4 w-4" />
              Espaçamento
            </Label>
            <span className="text-sm text-muted-foreground">{config.lineHeight.toFixed(1)}</span>
          </div>
          <Slider
            value={[config.lineHeight]}
            onValueChange={([value]) => updateConfig({ lineHeight: value })}
            min={1.2}
            max={2.5}
            step={0.1}
            className="w-full"
          />
        </div>

        {/* Largura Máxima do Texto */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Largura do Texto</Label>
            <span className="text-sm text-muted-foreground">
              {config.maxWidth === 100 ? 'Total' : `${config.maxWidth}%`}
            </span>
          </div>
          <Slider
            value={[config.maxWidth]}
            onValueChange={([value]) => updateConfig({ maxWidth: value })}
            min={60}
            max={100}
            step={5}
            className="w-full"
          />
        </div>

        {/* Família da Fonte */}
        <div className="space-y-2">
          <Label>Tipo de Fonte</Label>
          <Select
            value={config.fontFamily}
            onValueChange={(value: any) => updateConfig({ fontFamily: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="serif">Serifada (Tradicional)</SelectItem>
              <SelectItem value="sans">Sem Serifa (Moderna)</SelectItem>
              <SelectItem value="mono">Monoespaçada</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tema de Leitura */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Sun className="h-4 w-4" />
            Tema de Leitura
          </Label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => updateConfig({ theme: 'light' })}
              className={`p-3 rounded-lg border-2 transition-all ${
                config.theme === 'light'
                  ? 'border-primary bg-white text-black'
                  : 'border-muted bg-white text-black opacity-60'
              }`}
            >
              <Sun className="h-5 w-5 mx-auto mb-1" />
              <span className="text-xs font-semibold">Claro</span>
            </button>
            <button
              onClick={() => updateConfig({ theme: 'dark' })}
              className={`p-3 rounded-lg border-2 transition-all ${
                config.theme === 'dark'
                  ? 'border-primary bg-gray-900 text-white'
                  : 'border-muted bg-gray-900 text-white opacity-60'
              }`}
            >
              <Moon className="h-5 w-5 mx-auto mb-1" />
              <span className="text-xs font-semibold">Escuro</span>
            </button>
            <button
              onClick={() => updateConfig({ theme: 'sepia' })}
              className={`p-3 rounded-lg border-2 transition-all ${
                config.theme === 'sepia'
                  ? 'border-primary bg-[#f4ecd8] text-[#5c4a3a]'
                  : 'border-muted bg-[#f4ecd8] text-[#5c4a3a] opacity-60'
              }`}
            >
              <span className="text-2xl mx-auto mb-1">📖</span>
              <span className="text-xs font-semibold">Sépia</span>
            </button>
          </div>
        </div>

        {/* Modo Foco */}
        <div className="flex items-center justify-between">
          <div>
            <Label>Modo Foco</Label>
            <p className="text-xs text-muted-foreground mt-1">
              Ocultar menus e distrações
            </p>
          </div>
          <Switch
            checked={config.focusMode}
            onCheckedChange={(checked) => updateConfig({ focusMode: checked })}
          />
        </div>
      </CardContent>
    </Card>
  );
};
