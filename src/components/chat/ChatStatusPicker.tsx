import { usePresence } from "@/contexts/PresenceContext";
import { SELECTABLE_STATUSES, chatStatusConfig } from "@/lib/chatStatus";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

/** Escolha do próprio status — disponível / orando / servindo na obra / ocupado / offline */
export const ChatStatusPicker = () => {
  const { myStatus, setMyStatus } = usePresence();
  const current = chatStatusConfig(myStatus);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 h-8 rounded-full pl-2 pr-2.5">
          <span className={`h-2.5 w-2.5 rounded-full ${current.dotClass}`} />
          <span className="text-xs font-medium">{current.label}</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Meu status</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {SELECTABLE_STATUSES.map((s) => (
          <DropdownMenuItem
            key={s.value}
            onClick={() => setMyStatus(s.value)}
            className="gap-2 cursor-pointer"
          >
            <span className={`h-2.5 w-2.5 rounded-full ${s.dotClass}`} />
            <span className={myStatus === s.value ? "font-semibold" : ""}>{s.emoji} {s.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
