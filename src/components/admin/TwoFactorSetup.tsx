import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, ShieldAlert, Loader2, Copy, Check, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Status = "loading" | "none" | "enrolling" | "active";

/**
 * Ativa/gerencia o 2FA (app autenticador / TOTP) via Supabase MFA.
 * Opt-in: só passa a exigir 2FA DEPOIS que o admin ativa e confirma um
 * código válido (prova que o app está funcionando). Recuperação: remover
 * o fator aqui ou pelo painel do Supabase.
 */
export const TwoFactorSetup = () => {
  const { toast } = useToast();
  const [status, setStatus] = useState<Status>("loading");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const loadFactors = async () => {
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) { setStatus("none"); return; }
    const verified = (data?.totp || []).find((f) => f.status === "verified");
    if (verified) { setFactorId(verified.id); setStatus("active"); }
    else { setStatus("none"); }
  };

  useEffect(() => { loadFactors(); }, []);

  const startEnroll = async () => {
    setError(""); setBusy(true);
    // remove qualquer fator "não verificado" pendente (evita erro de duplicado)
    const { data: list } = await supabase.auth.mfa.listFactors();
    for (const f of list?.all || []) {
      if (f.status !== "verified") await supabase.auth.mfa.unenroll({ factorId: f.id });
    }
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: `admin-${Date.now()}` });
    setBusy(false);
    if (error || !data) { setError(error?.message || "Não foi possível iniciar o 2FA."); return; }
    setFactorId(data.id);
    setQr(data.totp?.qr_code || null);
    setSecret(data.totp?.secret || null);
    setStatus("enrolling");
  };

  const confirmEnroll = async () => {
    if (!factorId) return;
    setError(""); setBusy(true);
    const { data: ch, error: chErr } = await supabase.auth.mfa.challenge({ factorId });
    if (chErr || !ch) { setBusy(false); setError("Erro ao gerar o desafio. Tente de novo."); return; }
    const { error: vErr } = await supabase.auth.mfa.verify({ factorId, challengeId: ch.id, code: code.trim() });
    setBusy(false);
    if (vErr) { setError("Código incorreto. Confira no app e tente de novo."); setCode(""); return; }
    setCode(""); setQr(null); setSecret(null);
    toast({ title: "🔐 2FA ativado!", description: "A partir de agora o painel vai pedir o código do app." });
    setStatus("active");
  };

  const removeFactor = async () => {
    if (!factorId) return;
    setBusy(true);
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    setBusy(false);
    if (error) { toast({ title: "Erro ao remover 2FA", description: error.message, variant: "destructive" }); return; }
    setFactorId(null);
    toast({ title: "2FA removido", description: "O painel voltou a exigir apenas login + PIN." });
    setStatus("none");
  };

  const copySecret = async () => {
    if (!secret) return;
    try { await navigator.clipboard.writeText(secret); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* ignore */ }
  };

  return (
    <div className="max-w-lg mx-auto rounded-2xl border bg-card p-6 shadow-sm">
      {status === "loading" && (
        <div className="py-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      )}

      {status === "active" && (
        <div className="text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-emerald-500/15 text-emerald-500 grid place-items-center mb-3">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-bold">2FA está ATIVO ✅</h2>
          <p className="text-sm text-muted-foreground mt-1 mb-5">
            Ao entrar no painel, além do PIN, você digita o código de 6 dígitos do seu app autenticador.
          </p>
          <Button variant="outline" onClick={removeFactor} disabled={busy} className="text-destructive border-destructive/40">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Desativar 2FA"}
          </Button>
        </div>
      )}

      {status === "none" && (
        <div className="text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-amber-500/15 text-amber-500 grid place-items-center mb-3">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-bold">Verificação em 2 etapas (2FA)</h2>
          <p className="text-sm text-muted-foreground mt-1 mb-5">
            Proteja o painel com um código do app autenticador (Google Authenticator, Authy…). Grátis e offline.
          </p>
          <Button onClick={startEnroll} disabled={busy} className="!bg-gradient-to-r !from-amber-500 !to-orange-600 !text-white">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Smartphone className="h-4 w-4 mr-1.5" /> Ativar 2FA</>}
          </Button>
          {error && <p className="text-sm text-destructive mt-3">{error}</p>}
        </div>
      )}

      {status === "enrolling" && (
        <div>
          <h2 className="text-lg font-bold text-center mb-1">Escaneie no seu app</h2>
          <p className="text-sm text-muted-foreground text-center mb-4">
            Abra o Google Authenticator, toque em + e escaneie o QR. Depois digite o código de 6 dígitos.
          </p>
          <div className="w-52 h-52 mx-auto bg-white rounded-xl p-2 border">
            {qr && (qr.startsWith("<svg") ? (
              <div className="w-full h-full [&>svg]:w-full [&>svg]:h-full" dangerouslySetInnerHTML={{ __html: qr }} />
            ) : (
              <img src={qr} alt="QR do 2FA" className="w-full h-full" />
            ))}
          </div>
          {secret && (
            <div className="mt-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Ou digite esta chave no app:</p>
              <button onClick={copySecret} className="inline-flex items-center gap-2 font-mono text-sm bg-muted rounded-lg px-3 py-1.5">
                {secret} {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          )}
          <div className="mt-5 max-w-xs mx-auto">
            <Input
              inputMode="numeric" placeholder="Código de 6 dígitos" value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} maxLength={6}
              className="text-center tracking-[0.4em] text-lg"
              onKeyDown={(e) => e.key === "Enter" && confirmEnroll()}
            />
            {error && <p className="text-sm text-destructive mt-2 text-center">{error}</p>}
            <Button className="w-full mt-3 !bg-gradient-to-r !from-amber-500 !to-orange-600 !text-white" onClick={confirmEnroll} disabled={busy || code.length < 6}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar e ativar"}
            </Button>
            <Button variant="ghost" className="w-full mt-1" onClick={() => { setStatus("none"); setError(""); setCode(""); }}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TwoFactorSetup;
