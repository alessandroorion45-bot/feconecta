import { createContext, useContext, useState, useEffect, ReactNode } from "react";
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
    if (!user) {
      setUserRole(null);
      setPermissions([]);
      setLoading(false);
      return;
    }

    try {
      // Buscar role mais alta do usuário
      const { data: roleData, error: roleError } = await supabase
        .rpc("get_highest_role", { user_id: user.id });

      if (roleError) throw roleError;
      setUserRole(roleData as UserRole);

      // Buscar permissões do usuário
      const { data: permissionsData, error: permissionsError } = await supabase
        .rpc("get_user_permissions", { input_user_id: user.id });

      if (permissionsError) throw permissionsError;

      const permissionNames = (permissionsData || []).map(
        (p: { permission_name: string }) => p.permission_name
      );
      setPermissions(permissionNames);
    } catch (error) {
      console.error("Erro ao carregar permissões:", error);
      setUserRole("user"); // Fallback para user comum
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshPermissions = async () => {
    setLoading(true);
    await loadPermissions();
  };

  useEffect(() => {
    loadPermissions();
  }, [user]);

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
