import { ReactNode, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/contexts/AdminContext";
import { useAdminIdleTimeout } from "@/hooks/useAdminIdleTimeout";
import { AdminAccessDenied } from "@/components/AdminAccessDenied";
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

  // Log de acesso (admin) e de tentativa negada (não-admin): 1 registro
  // por tela por sessão de aba. setTimeout(0) pra nunca rodar chamada
  // Supabase de forma síncrona dentro do fluxo de render/auth (lição do
  // deadlock de onAuthStateChange).
  useEffect(() => {
    if (adminLoading) return;
    const path = location.pathname;
    const key = `${isAdmin ? "ok" : "denied"}:${path}`;
    if (loggedPaths.has(key)) return;
    loggedPaths.add(key);
    setTimeout(() => {
      supabase
        .rpc("log_user_activity", {
          p_user_id: userIdRef.current,
          p_action_type: isAdmin ? "admin_panel_access" : "admin_access_denied",
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
    return <AdminAccessDenied />;
  }

  return <>{children}</>;
};
