import { useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, Lock, Loader2, KeyRound } from "lucide-react";

const SESSION_KEY = "admin-vault-unlocked";
const DEVICE_KEY = "admin-device-token";

function getDeviceToken(): string {
  try {
    let t = localStorage.getItem(DEVICE_KEY);
    if (!t) { t = crypto.randomUUID(); localStorage.setItem(DEVICE_KEY, t); }
    return t;
  } catch {
    return "no-storage-fallback-token";
  }
}

/**
 * Cofre do Admin — segunda senha (PIN) exigida ao entrar no painel, ALÉM
 * do login. Destranca por aba/sessão (fecha e trava de novo). O PIN é
 * verificado no servidor (hash bcrypt); nunca trafega/armazena em texto.
 */
export const AdminPinGate = ({ children }: { children: ReactNode }) => {
  const [unlocked, setUnlocked] = useState<boolean>(() => {
    try { return sessionStorage.getItem(SESSION_KEY) === "1"; } catch { return false; }
  });
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"create" | "enter">("enter");
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    if (unlocked) { setLoading(false); return; }
    supabase.rpc("admin_pin_status").then(({ data, error }) => {
      if (error) { setError("Não foi possível verificar a segurança do painel."); setLoading(false); return; }
      const d = data as { has_pin?: boolean; locked?: boolean };
      setMode(d?.has_pin ? "enter" : "create");
      if (d?.locked) setLocked(true);
      setLoading(false);
    });
  }, [unlocked]);

  const doUnlock = () => {
    try { sessionStorage.setItem(SESSION_KEY, "1"); } catch { /* ignore */ }
    setUnlocked(true);
  };

  const handleCreate = async () => {
    setError("");
    if (pin.length < 4) { setError("O PIN precisa de pelo menos 4 dígitos."); return; }
    if (pin !== pin2) { setError("Os PINs não coincidem."); return; }
    setBusy(true);
    const { data, error } = await supabase.rpc("set_admin_pin", { p_pin: pin });
    setBusy(false);
    const d = data as { ok?: boolean; error?: string };
    if (error || !d?.ok) { setError(d?.error || "Não foi possível criar o PIN."); return; }
    doUnlock();
  };

  const handleEnter = async () => {
    setError("");
    setBusy(true);
    const { data, error } = await supabase.rpc("verify_admin_pin", { p_pin: pin, p_device: getDeviceToken() });
    setBusy(false);
    const d = data as { ok?: boolean; locked?: boolean; remaining?: number };
    if (error) { setError("Erro ao verificar o PIN."); return; }
    if (d?.ok) { doUnlock(); return; }
    if (d?.locked) { setLocked(true); setError("Muitas tentativas erradas. Cofre bloqueado por 15 minutos."); return; }
    setError(`PIN incorreto. ${d?.remaining ?? 0} tentativa(s) restante(s).`);
    setPin("");
  };

  if (unlocked) return <>{children}</>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-100 via-white to-amber-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 p-4">
      <div className="w-full max-w-sm rounded-3xl border border-amber-200/60 dark:border-amber-900/40 bg-white dark:bg-zinc-900 shadow-2xl p-7 text-center">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white grid place-items-center mb-4 shadow-lg">
          {locked ? <Lock className="h-8 w-8" /> : <ShieldCheck className="h-8 w-8" />}
        </div>

        {loading ? (
          <div className="py-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-amber-500" /></div>
        ) : locked ? (
          <>
            <h1 className="text-xl font-bold mb-1">Cofre bloqueado</h1>
            <p className="text-sm text-muted-foreground">Muitas tentativas erradas. Tente novamente em alguns minutos.</p>
          </>
        ) : mode === "create" ? (
          <>
            <h1 className="text-xl font-bold mb-1">Crie o PIN do cofre</h1>
            <p className="text-sm text-muted-foreground mb-5">Uma segunda senha só sua, exigida sempre que abrir o painel admin.</p>
            <div className="space-y-2 text-left">
              <Input type="password" inputMode="numeric" autoFocus placeholder="Novo PIN (mín. 4 dígitos)"
                value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} maxLength={12} />
              <Input type="password" inputMode="numeric" placeholder="Repita o PIN"
                value={pin2} onChange={(e) => setPin2(e.target.value.replace(/\D/g, ""))} maxLength={12}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()} />
            </div>
            {error && <p className="text-sm text-destructive mt-2">{error}</p>}
            <Button className="w-full mt-4 !bg-gradient-to-r !from-amber-500 !to-orange-600 !text-white" onClick={handleCreate} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><KeyRound className="h-4 w-4 mr-1.5" /> Criar PIN e entrar</>}
            </Button>
            <p className="text-[11px] text-muted-foreground mt-3">Anote esse PIN num lugar seguro. Sem ele, você não entra no painel.</p>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold mb-1">Cofre do Admin</h1>
            <p className="text-sm text-muted-foreground mb-5">Digite o PIN para acessar o painel.</p>
            <Input type="password" inputMode="numeric" autoFocus placeholder="PIN do cofre"
              value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} maxLength={12}
              onKeyDown={(e) => e.key === "Enter" && handleEnter()} className="text-center tracking-widest" />
            {error && <p className="text-sm text-destructive mt-2">{error}</p>}
            <Button className="w-full mt-4 !bg-gradient-to-r !from-amber-500 !to-orange-600 !text-white" onClick={handleEnter} disabled={busy || !pin}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Lock className="h-4 w-4 mr-1.5" /> Destrancar</>}
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminPinGate;
