import { ReactNode, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShieldX, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/contexts/AdminContext";
import { useAdminIdleTimeout } from "@/hooks/useAdminIdleTimeout";
import { supabase } from "@/integrations/supabase/client";

interface AdminRouteProps {
  children: ReactNode;
}

// Telas do painel já registradas nesta aba (evita inundar o log a cada
// re-render/navegação repetida — 1 registro por tela por sessão de aba).
const loggedPaths = new Set<string>();

/**
 * Camada de autorização das rotas /admin/* — sempre aninhada DENTRO de
 * ProtectedRoute (que cuida do caso 401/não autenticado). Aqui é o 403:
 * usuário autenticado SEM papel administrativo vê uma negativa explícita
 * em vez de redirect silencioso. As guardas individuais das páginas
 * admin continuam existindo como defesa em profundidade.
 *
 * Também ancora o encerramento de sessão por inatividade e o log de
 * acesso às telas do painel (quem acessou o quê, quando).
 */
export const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const location = useLocation();
  const userIdRef = useRef<string | null>(null);
  userIdRef.current = user?.id ?? null;

  useAdminIdleTimeout(isAdmin);

  // Log de acesso: 1 registro por tela do painel por sessão de aba.
  // setTimeout(0) pra nunca rodar chamada Supabase de forma síncrona
  // dentro do fluxo de render/auth (lição do deadlock de onAuthStateChange).
  useEffect(() => {
    if (!isAdmin || adminLoading) return;
    const path = location.pathname;
    if (loggedPaths.has(path)) return;
    loggedPaths.add(path);
    setTimeout(() => {
      supabase
        .rpc("log_user_activity", {
          p_user_id: userIdRef.current,
          p_action_type: "admin_panel_access",
          p_details: { path },
        } as never)
        .then(({ error }) => {
          if (error) console.error("Falha ao registrar acesso admin:", error.message);
        });
    }, 0);
  }, [isAdmin, adminLoading, location.pathname]);

  if (adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <ShieldX className="h-8 w-8 text-destructive" />
          </div>
          <p className="text-xs font-semibold tracking-widest text-muted-foreground mb-2">ERRO 403</p>
          <h1 className="text-2xl font-bold mb-2">Acesso negado</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Sua conta não tem permissão para acessar o painel administrativo.
            Se você acredita que isso é um engano, fale com um administrador.
          </p>
          <Link to="/feed">
            <Button className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Voltar ao app
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
