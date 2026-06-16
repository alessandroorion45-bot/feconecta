import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Check, ChevronDown, Music, Users, Heart, Baby, Megaphone, Monitor, HandHeart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

interface ChurchRoleMinistrySelectProps {
  churchRole: string | null;
  ministries: string[];
  onChurchRoleChange: (role: string | null) => void;
  onMinistriesChange: (ministries: string[]) => void;
}

const churchRoles = [
  { value: 'membro_ativo', label: 'Membro ativo', icon: '✝️' },
  { value: 'visitante', label: 'Visitante/Frequentador', icon: '👋' },
  { value: 'lider_espiritual', label: 'Líder espiritual', icon: '🌟' },
  { value: 'pastor', label: 'Pastor(a)', icon: '⛪' },
  { value: 'voluntario', label: 'Voluntário(a)', icon: '🤝' }
];

const ministryOptions = [
  { value: 'louvor', label: 'Louvor', icon: Music, color: 'from-purple-500 to-pink-500' },
  { value: 'danca', label: 'Dança', icon: Heart, color: 'from-pink-500 to-rose-500' },
  { value: 'intercessao', label: 'Intercessão', icon: Users, color: 'from-blue-500 to-cyan-500' },
  { value: 'infantil', label: 'Infantil', icon: Baby, color: 'from-amber-500 to-orange-500' },
  { value: 'evangelismo', label: 'Evangelismo', icon: Megaphone, color: 'from-green-500 to-emerald-500' },
  { value: 'multimidia', label: 'Multimídia', icon: Monitor, color: 'from-indigo-500 to-violet-500' },
  { value: 'acao_social', label: 'Ação Social', icon: HandHeart, color: 'from-red-500 to-pink-500' }
];

export const ChurchRoleMinistrySelect: React.FC<ChurchRoleMinistrySelectProps> = ({
  churchRole,
  ministries,
  onChurchRoleChange,
  onMinistriesChange
}) => {
  const [ministriesOpen, setMinistriesOpen] = useState(false);

  const toggleMinistry = (value: string) => {
    if (ministries.includes(value)) {
      onMinistriesChange(ministries.filter(m => m !== value));
    } else {
      onMinistriesChange([...ministries, value]);
    }
  };

  const getMinistryLabel = (value: string) => {
    return ministryOptions.find(m => m.value === value)?.label || value;
  };

  return (
    <div className="space-y-4">
      {/* Church Role */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Vínculo com a igreja</Label>
        <Select
          value={churchRole || ''}
          onValueChange={(value) => onChurchRoleChange(value || null)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione seu vínculo..." />
          </SelectTrigger>
          <SelectContent>
            {churchRoles.map((role) => (
              <SelectItem key={role.value} value={role.value}>
                <span className="flex items-center gap-2">
                  <span>{role.icon}</span>
                  <span>{role.label}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Ministries */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Ministérios que participa</Label>
        <Popover open={ministriesOpen} onOpenChange={setMinistriesOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={ministriesOpen}
              className="w-full justify-between h-auto min-h-10 py-2"
            >
              {ministries.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {ministries.map((ministry) => (
                    <Badge
                      key={ministry}
                      variant="secondary"
                      className="text-xs"
                    >
                      {getMinistryLabel(ministry)}
                    </Badge>
                  ))}
                </div>
              ) : (
                <span className="text-muted-foreground">Selecione os ministérios...</span>
              )}
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-2" align="start">
            <div className="grid gap-1">
              {ministryOptions.map((ministry) => {
                const Icon = ministry.icon;
                const isSelected = ministries.includes(ministry.value);
                
                return (
                  <button
                    key={ministry.value}
                    onClick={() => toggleMinistry(ministry.value)}
                    className={cn(
                      'flex items-center gap-3 w-full px-3 py-2 rounded-lg transition-colors',
                      'hover:bg-muted/50',
                      isSelected && 'bg-primary/10'
                    )}
                  >
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center',
                      `bg-gradient-to-br ${ministry.color}`,
                      'text-white'
                    )}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="flex-1 text-left text-sm">{ministry.label}</span>
                    {isSelected && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

// Display component for profile view
export const ChurchRoleMinistryDisplay: React.FC<{
  churchRole: string | null;
  ministries: string[];
  className?: string;
}> = ({ churchRole, ministries, className }) => {
  if (!churchRole && ministries.length === 0) return null;

  const role = churchRoles.find(r => r.value === churchRole);

  return (
    <div className={cn('space-y-3', className)}>
      {role && (
        <div className="flex items-center gap-2 justify-center">
          <span className="text-lg">{role.icon}</span>
          <span className="text-sm font-medium text-foreground">{role.label}</span>
        </div>
      )}
      
      {ministries.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center">
          {ministries.map((ministry) => {
            const ministryData = ministryOptions.find(m => m.value === ministry);
            if (!ministryData) return null;
            
            const Icon = ministryData.icon;
            
            return (
              <div
                key={ministry}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium',
                  `bg-gradient-to-r ${ministryData.color}`,
                  'text-white shadow-sm'
                )}
              >
                <Icon className="h-3 w-3" />
                {ministryData.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
