import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import SEO from "@/components/SEO";
import { KeyRound, Eye, EyeOff, Loader2, ShieldCheck, AlertCircle } from "lucide-react";

/**
 * Definir nova senha (fim do fluxo de "esqueci minha senha").
 *
 * Faltava esta tela: o e-mail de recuperação era enviado e o link levava para
 * /auth, que tratava o token como login social — a pessoa entrava no app mas
 * NUNCA conseguia trocar a senha, e no logout seguinte ficava trancada de novo.
 * O Supabase consome o token da URL sozinho e cria uma sessão de recuperação;
 * aqui só pedimos a nova senha e gravamos.
 */
export default function ResetPassword() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [senha, setSenha] = useState("");
  const [confirma, setConfirma] = useState("");
  const [mostrar, setMostrar] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [linkValido, setLinkValido] = useState<boolean | null>(null);

  // O link só vale se o Supabase tiver criado a sessão de recuperação.
  useEffect(() => {
    let vivo = true;
    const conferir = async () => {
      const { data } = await supabase.auth.getSession();
      if (vivo) setLinkValido(!!data.session);
    };
    // pequeno atraso: o SDK ainda pode estar lendo o token da URL
    const t = setTimeout(conferir, 600);
    return () => { vivo = false; clearTimeout(t); };
  }, []);

  const forte = senha.length >= 8;
  const iguais = senha.length > 0 && senha === confirma;

  const salvar = async () => {
    if (!forte) {
      toast({ title: "Senha muito curta", description: "Use pelo menos 8 caracteres.", variant: "destructive" });
      return;
    }
    if (!iguais) {
      toast({ title: "As senhas não coincidem", description: "Digite a mesma senha nos dois campos.", variant: "destructive" });
      return;
    }

    setSalvando(true);
    const { error } = await supabase.auth.updateUser({ password: senha });
    setSalvando(false);

    if (error) {
      toast({ title: "Não foi possível alterar", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "🔒 Senha alterada!", description: "Bem-vindo(a) de volta. Que Deus abençoe sua caminhada. 🙏" });
    navigate("/feed", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero px-4 py-10">
      <SEO path="/redefinir-senha" title="Definir nova senha" noindex />

      <Card className="w-full max-w-md shadow-divine">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg">
            <KeyRound className="h-7 w-7 text-white" />
          </div>
          <CardTitle className="text-2xl">Definir nova senha</CardTitle>
          <CardDescription>Escolha uma senha nova para voltar à sua conta.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {linkValido === false ? (
            <div className="text-center space-y-4 py-4">
              <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
              <div>
                <p className="font-semibold">Link expirado ou já usado</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Os links de recuperação valem por pouco tempo e só podem ser usados uma vez.
                  Peça um novo na tela de entrada.
                </p>
              </div>
              <Button className="w-full" onClick={() => navigate("/auth")}>
                Pedir novo link
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Nova senha</label>
                <div className="relative">
                  <Input
                    type={mostrar ? "text" : "password"}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Pelo menos 8 caracteres"
                    autoComplete="new-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrar((m) => !m)}
                    aria-label={mostrar ? "Ocultar senha" : "Mostrar senha"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {mostrar ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className={`text-xs ${forte ? "text-emerald-600" : "text-muted-foreground"}`}>
                  {forte ? "✓ Tamanho bom" : "Mínimo de 8 caracteres"}
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Repita a nova senha</label>
                <Input
                  type={mostrar ? "text" : "password"}
                  value={confirma}
                  onChange={(e) => setConfirma(e.target.value)}
                  placeholder="Digite de novo"
                  autoComplete="new-password"
                />
                {confirma.length > 0 && (
                  <p className={`text-xs ${iguais ? "text-emerald-600" : "text-destructive"}`}>
                    {iguais ? "✓ As senhas conferem" : "As senhas não coincidem"}
                  </p>
                )}
              </div>

              <Button
                className="w-full gap-2 h-11"
                onClick={salvar}
                disabled={salvando || !forte || !iguais || linkValido === null}
              >
                {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                {salvando ? "Salvando..." : "Salvar nova senha"}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Depois de salvar, você já entra direto na sua conta.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
