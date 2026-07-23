import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAdminActions } from "@/hooks/useAdminActions";
import { useToast } from "@/hooks/use-toast";
import { ShieldAlert, Clock, Ban, MoreVertical, Loader2 } from "lucide-react";

type ActionKind = "warn" | "suspend" | "ban";

interface ModerationActionsProps {
  userId: string;
  userName: string;
  /** motivo pré-preenchido (ex.: contexto da violação) */
  defaultReason?: string;
  /** chamado após uma ação concluída com sucesso */
  onDone?: () => void;
}

const SUSPEND_OPTIONS = [1, 3, 7, 30];

const ACTION_META: Record<ActionKind, { label: string; icon: typeof ShieldAlert; accent: string; verb: string }> = {
  warn: { label: "Advertir", icon: ShieldAlert, accent: "amber", verb: "advertir" },
  suspend: { label: "Suspender", icon: Clock, accent: "orange", verb: "suspender" },
  ban: { label: "Banir", icon: Ban, accent: "red", verb: "banir" },
};

/**
 * Menu de moderação reutilizável (advertir / suspender / banir) com
 * confirmação e motivo. Reusa as RPCs warn_user/suspend_user/ban_user
 * (que já checam is_admin no servidor) via useAdminActions — sem lógica
 * nova de punição, só a UI. Pode ser plugado em qualquer linha de
 * usuário no admin.
 */
export const ModerationActions = ({ userId, userName, defaultReason, onDone }: ModerationActionsProps) => {
  const { warnUser, suspendUser, banUser } = useAdminActions();
  const { toast } = useToast();
  const [action, setAction] = useState<ActionKind | null>(null);
  const [reason, setReason] = useState("");
  const [days, setDays] = useState(7);
  const [submitting, setSubmitting] = useState(false);

  const open = (kind: ActionKind) => {
    setAction(kind);
    setReason(defaultReason ?? "");
    setDays(7);
  };

  const close = () => {
    if (submitting) return;
    setAction(null);
  };

  const confirm = async () => {
    if (!action) return;
    const finalReason = reason.trim() || "Compartilhamento reincidente de links externos";
    setSubmitting(true);
    let ok = false;
    if (action === "warn") ok = await warnUser(userId, finalReason);
    else if (action === "suspend") ok = await suspendUser(userId, finalReason, days);
    else if (action === "ban") ok = await banUser(userId, finalReason);
    setSubmitting(false);

    if (ok) {
      toast({
        title:
          action === "warn"
            ? "⚠️ Usuário advertido"
            : action === "suspend"
              ? `⏳ Usuário suspenso por ${days} ${days === 1 ? "dia" : "dias"}`
              : "🚫 Usuário banido",
        description: userName,
      });
      setAction(null);
      onDone?.();
    } else {
      toast({
        title: "Não foi possível aplicar a ação",
        description: "Tente novamente ou verifique suas permissões.",
        variant: "destructive",
      });
    }
  };

  const meta = action ? ACTION_META[action] : null;
  const Icon = meta?.icon ?? ShieldAlert;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1">
            Moderar <MoreVertical className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onClick={() => open("warn")} className="gap-2 text-amber-600 focus:text-amber-700">
            <ShieldAlert className="h-4 w-4" /> Advertir
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => open("suspend")} className="gap-2 text-orange-600 focus:text-orange-700">
            <Clock className="h-4 w-4" /> Suspender
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => open("ban")} className="gap-2 text-red-600 focus:text-red-700">
            <Ban className="h-4 w-4" /> Banir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={!!action} onOpenChange={(o) => !o && close()}>
        <DialogContent className="sm:max-w-md overflow-hidden">
          {/* faixa de cor por gravidade da ação */}
          <div
            className={`absolute inset-x-0 top-0 h-1.5 ${
              meta?.accent === "amber"
                ? "bg-gradient-to-r from-amber-400 to-yellow-500"
                : meta?.accent === "orange"
                  ? "bg-gradient-to-r from-orange-400 to-orange-600"
                  : "bg-gradient-to-r from-red-500 to-rose-600"
            }`}
          />
          <DialogHeader>
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className={`flex h-11 w-11 items-center justify-center rounded-full ${
                  meta?.accent === "amber"
                    ? "bg-amber-500/15 text-amber-600"
                    : meta?.accent === "orange"
                      ? "bg-orange-500/15 text-orange-600"
                      : "bg-red-500/15 text-red-600"
                }`}
              >
                <Icon className="h-5 w-5" />
              </motion.div>
              <div>
                <DialogTitle>{meta?.label} usuário</DialogTitle>
                <DialogDescription className="mt-0.5">{userName}</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {action === "suspend" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <p className="text-sm font-medium mb-2">Duração da suspensão</p>
                <div className="flex flex-wrap gap-2">
                  {SUSPEND_OPTIONS.map((d) => (
                    <button
                      key={d}
                      onClick={() => setDays(d)}
                      className={`rounded-lg border px-3 py-1.5 text-sm transition-all ${
                        days === d
                          ? "border-orange-500 bg-orange-500/10 text-orange-700 dark:text-orange-300 font-semibold"
                          : "border-border hover:border-orange-400/60"
                      }`}
                    >
                      {d} {d === 1 ? "dia" : "dias"}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <p className="text-sm font-medium mb-2">Motivo {action === "ban" ? "(será registrado)" : ""}</p>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Descreva o motivo da ação..."
              rows={3}
            />
          </div>

          {action === "ban" && (
            <div className="rounded-lg bg-red-500/5 border border-red-500/20 px-3 py-2 text-xs text-red-600 dark:text-red-300">
              O banimento é permanente e revoga o acesso do usuário à plataforma. Use com responsabilidade.
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={close} disabled={submitting}>
              Cancelar
            </Button>
            <Button
              onClick={confirm}
              disabled={submitting}
              className={
                meta?.accent === "amber"
                  ? "bg-amber-500 hover:bg-amber-600 text-white"
                  : meta?.accent === "orange"
                    ? "bg-orange-500 hover:bg-orange-600 text-white"
                    : "bg-red-600 hover:bg-red-700 text-white"
              }
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : `Confirmar ${meta?.verb}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ModerationActions;
