import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { AvatarPro } from "@/components/AvatarPro";
import { Search, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CommunityMemberOption {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  city: string | null;
}

interface MemberPickerProps {
  communityId: string;
  value: CommunityMemberOption | null;
  onSelect: (member: CommunityMemberOption | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * Busca membros já cadastrados na comunidade (nunca membros de outras
 * comunidades) — evita duplicar nome/foto/etc. que já existem em `profiles`.
 */
const MemberPicker = ({ communityId, value, onSelect, placeholder = "Buscar membro...", disabled }: MemberPickerProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<CommunityMemberOption[]>([]);
  const [loaded, setLoaded] = useState(false);

  const loadMembers = async () => {
    if (loaded) return;
    setLoading(true);
    const { data } = await supabase
      .from("church_community_members")
      .select("user_id")
      .eq("community_id", communityId)
      .eq("is_active", true);
    const ids = [...new Set((data || []).map(m => m.user_id))];
    if (ids.length) {
      const { data: profiles } = await supabase.from("profiles").select("id, full_name, avatar_url, city").in("id", ids);
      setMembers((profiles || []).map(p => ({ user_id: p.id, full_name: p.full_name || "Sem nome", avatar_url: p.avatar_url, city: p.city })));
    }
    setLoaded(true);
    setLoading(false);
  };

  useEffect(() => {
    setLoaded(false);
    setMembers([]);
  }, [communityId]);

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (o) loadMembers(); }}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          disabled={disabled}
          className="w-full justify-between font-normal"
        >
          {value ? (
            <span className="flex items-center gap-2 truncate">
              <AvatarPro src={value.avatar_url} name={value.full_name} size="xs" clickable={false} />
              {value.full_name}
            </span>
          ) : (
            <span className="flex items-center gap-2 text-muted-foreground"><Search className="h-3.5 w-3.5" /> {placeholder}</span>
          )}
          <span className="flex items-center gap-1 shrink-0">
            {value && (
              <X
                className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground"
                onClick={(e) => { e.stopPropagation(); onSelect(null); }}
              />
            )}
            <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={true}>
          <CommandInput placeholder="Digite o nome do membro..." />
          <CommandList>
            {loading ? (
              <div className="py-4 text-center text-sm text-muted-foreground">Carregando...</div>
            ) : (
              <>
                <CommandEmpty>Nenhum membro encontrado.</CommandEmpty>
                <CommandGroup>
                  {members.map(m => (
                    <CommandItem
                      key={m.user_id}
                      value={m.full_name}
                      onSelect={() => { onSelect(m); setOpen(false); }}
                    >
                      <AvatarPro src={m.avatar_url} name={m.full_name} size="xs" clickable={false} />
                      <span className={cn("ml-2 truncate", value?.user_id === m.user_id && "font-medium")}>{m.full_name}</span>
                      {m.city && <span className="ml-auto text-xs text-muted-foreground shrink-0">{m.city}</span>}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default MemberPicker;
