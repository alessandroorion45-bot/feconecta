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
  const { user } = useAuth();
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
      // SIMPLIFICADO: Verificar se é super_admin pelo email
      // Evita queries desnecessárias que podem dar timeout
      const adminEmails = ['alessandroibama40@gmail.com'];
      const isSuperAdminEmail = adminEmails.includes(user.email || '');

      if (isSuperAdminEmail) {
        console.log('[AdminContext] Super admin detected by email');
        setUserRole('super_admin');
        setPermissions(['*']); // Todas as permissões
        setLoading(false);
        return;
      }

      // ✅ SIMPLIFICADO: Todos os outros usuários são "user" comum
      // Tabelas user_roles e permissions não existem ainda
      console.log('[AdminContext] Setting as regular user (no role tables)');
      setUserRole('user');
      setPermissions([]);
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
    const userKey = user?.id || 'no-user';

    // Guard: previne múltiplas chamadas para o mesmo user
    if (loadPermissionsRef.current === userKey) {
      return;
    }

    loadPermissionsRef.current = userKey;
    loadPermissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // Depende apenas do user.id, não do objeto user inteiro

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
