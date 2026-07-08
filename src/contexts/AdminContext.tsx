import { createContext, useContext, useState, useEffect, ReactNode, useRef } from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "@/integrations/supabase/client";

// Types
export type UserRole = "super_admin" | "admin" | "moderator" | "vip" | "user";

export interface AdminContextType {
  // Roles
  userRole: UserRole | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isModerator: boolean;
  isVIP: boolean;

  // Permissions
  hasPermission: (permission: string) => boolean;
  permissions: string[];

  // Loading
  loading: boolean;

  // Refresh
  refreshPermissions: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const loadPermissionsRef = useRef<string | null>(null);

  // Derivados
  const isAdmin = userRole === "super_admin" || userRole === "admin" || userRole === "moderator";
  const isSuperAdmin = userRole === "super_admin";
  const isModerator = userRole === "moderator";
  const isVIP = userRole === "vip";

  const hasPermission = (permission: string): boolean => {
    // Super admin sempre tem todas as permissões
    if (userRole === "super_admin") return true;
    return permissions.includes(permission);
  };

  const loadPermissions = async () => {
    console.log('[AdminContext] loadPermissions called, user:', user?.id);

    if (!user) {
      console.log('[AdminContext] No user found, setting defaults');
      setUserRole(null);
      setPermissions([]);
      setLoading(false);
      return;
    }

    try {
      const [{ data: role, error: roleError }, { data: perms, error: permsError }] = await Promise.all([
        supabase.rpc('get_highest_role', { user_id: user.id }),
        supabase.rpc('get_user_permissions', { input_user_id: user.id }),
      ]);

      if (roleError) throw roleError;

      console.log('[AdminContext] Role loaded from user_roles:', role);
      setUserRole((role as UserRole) || 'user');

      if (permsError) {
        console.error('[AdminContext] Erro ao carregar permissões:', permsError);
        setPermissions([]);
      } else {
        setPermissions((perms || []).map((p: { permission_name: string }) => p.permission_name));
      }
    } catch (error) {
      console.error("[AdminContext] Erro ao carregar permissões:", error);
      setUserRole("user"); // Fallback para user comum
      setPermissions([]);
    } finally {
      setLoading(false);
      console.log('[AdminContext] Loading complete');
    }
  };

  const refreshPermissions = async () => {
    setLoading(true);
    await loadPermissions();
  };

  useEffect(() => {
    // Espera o AuthContext terminar de resolver a sessão antes de decidir
    // qualquer coisa aqui. Sem isso, "user" ainda está no estado inicial
    // (null) no primeiro render, loadPermissions() conclui "sem admin"
    // prematuramente (loading=false, isAdmin=false) e páginas que fazem
    // `if (!isAdmin) navigate("/")` redirecionam antes da checagem real
    // terminar — mesmo para o super_admin. Achado testando login com
    // Playwright: /admin redirecionava pra /feed em toda navegação dura.
    if (authLoading) return;

    const userKey = user?.id || 'no-user';

    // Guard: previne múltiplas chamadas para o mesmo user
    if (loadPermissionsRef.current === userKey) {
      return;
    }

    loadPermissionsRef.current = userKey;
    loadPermissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, authLoading]);

  const value: AdminContextType = {
    userRole,
    isAdmin,
    isSuperAdmin,
    isModerator,
    isVIP,
    hasPermission,
    permissions,
    loading,
    refreshPermissions,
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error("useAdmin must be used within AdminProvider");
  }
  return context;
}
