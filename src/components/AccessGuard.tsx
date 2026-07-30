import { ReactNode, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Ban, LogOut, Clock } from "lucide-react";

interface Block { blocked: boolean; type?: string; reason?: string; until?: string | null; }

// Cache por carga de app (reseta em reload/nova aba). Evita reconsultar a cada
// navegação, mas pega o bloqueio assim que o app abre.
let cached: Block | null = null;
let cachedAt = 0;

/**
 * Barreira de acesso: se a conta está suspensa/banida, mostra a tela de
 * bloqueio em vez do app. Alimentada por get_my_access_block (punições ativas).
 */
export const AccessGuard = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<"checking" | "ok" | "blocked">(
    cached ? (cached.blocked ? "blocked" : "ok") : "checking"
  );
  const [info, setInfo] = useState<Block | null>(cached);

  useEffect(() => {
    if (cached && Date.now() - cachedAt < 5 * 60 * 1000) {
      setState(cached.blocked ? "blocked" : "ok");
      return;
    }
    supabase.rpc("get_my_access_block").then(({ data, error }) => {
      if (error) { setState("ok"); return; } // infra: não trava
      const d = data as unknown as Block;
      cached = d; cachedAt = Date.now();
      if (d?.blocked) { setInfo(d); setState("blocked"); } else setState("ok");
    });
  }, []);

  if (state === "checking") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (state === "blocked") {
    const permanent = info?.type === "ban" || !info?.until;
    const until = info?.until ? new Date(info.until).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : null;
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-rose-50 dark:from-zinc-950 dark:to-zinc-900 p-4">
        <div className="w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden text-center">
          <div className="bg-gradient-to-br from-red-600 to-rose-700 text-white pt-8 pb-6 px-6">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-white/20 grid place-items-center mb-3"><Ban className="h-8 w-8" /></div>
            <h1 className="text-2xl font-extrabold">{permanent ? "Conta excluída" : "Conta suspensa"}</h1>
          </div>
          <div className="px-6 py-6">
            <p className="text-sm text-foreground/85 leading-relaxed">
              {permanent
                ? "Sua conta foi removida da plataforma por violar as regras de convivência."
                : "Sua conta está temporariamente suspensa por uso de linguagem imprópria ou desrespeito."}
            </p>
            {!permanent && until && (
              <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-red-600">
                <Clock className="h-4 w-4" /> Liberada em {until}
              </p>
            )}
            <p className="text-[11px] text-muted-foreground mt-4">
              Esta é uma comunidade cristã. Cremos na restauração — reflita e volte em paz. 🙏
            </p>
            <Button variant="outline" className="w-full mt-5" onClick={() => supabase.auth.signOut().then(() => (window.location.href = "/"))}>
              <LogOut className="h-4 w-4 mr-2" /> Sair
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AccessGuard;
