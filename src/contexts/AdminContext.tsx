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

      // Para outros usuários, tentar buscar roles (com timeout curto de 3 segundos)
      console.log('[AdminContext] Fetching roles from user_roles table');

      const rolesPromise = supabase
        .from('user_roles')
        .select('role, is_active, expires_at')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('role', { ascending: true });

      // Timeout REDUZIDO para 3 segundos
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('ROLES_QUERY_TIMEOUT')), 3000)
      );

      const { data: rolesData, error: rolesError } = await Promise.race([
        rolesPromise,
        timeoutPromise
      ]).catch((err) => {
        console.warn('[AdminContext] Roles query timeout or error (usando fallback):', err);
        return { data: null, error: err };
      }) as { data: any; error: any };

      if (rolesError || !rolesData) {
        // Fallback: usuário comum
        console.log('[AdminContext] Using fallback: user role');
        setUserRole('user');
        setPermissions([]);
        setLoading(false);
        return;
      }

      console.log('[AdminContext] Roles fetched successfully:', rolesData);

      // Determinar role mais alta
      const roleOrder: Record<UserRole, number> = {
        'super_admin': 1,
        'admin': 2,
        'moderator': 3,
        'vip': 4,
        'user': 5
      };

      let highestRole: UserRole = 'user';
      if (rolesData && rolesData.length > 0) {
        // Filtrar roles expiradas
        const validRoles = rolesData.filter(r =>
          !r.expires_at || new Date(r.expires_at) > new Date()
        );

        if (validRoles.length > 0) {
          highestRole = validRoles.reduce((highest, current) => {
            const currentOrder = roleOrder[current.role as UserRole] || 999;
            const highestOrder = roleOrder[highest as UserRole] || 999;
            return currentOrder < highestOrder ? current.role as UserRole : highest;
          }, validRoles[0].role as UserRole);
        }
      }

      console.log('[AdminContext] Highest role:', highestRole);
      setUserRole(highestRole);

      // Permissões baseadas no role (não precisa buscar do banco)
      const permissionNames: string[] = [];

      if (highestRole === 'super_admin' || highestRole === 'admin') {
        permissionNames.push('*'); // Todas as permissões
      } else if (highestRole === 'moderator') {
        permissionNames.push('moderate_content', 'view_reports');
      } else if (highestRole === 'vip') {
        permissionNames.push('vip_features');
      }

      console.log('[AdminContext] Permissions assigned:', permissionNames);

      // Super admin tem TODAS as permissões
      if (highestRole === 'super_admin') {
        const { data: allPerms } = await supabase
          .from('permissions')
          .select('name');

        if (allPerms) {
          allPerms.forEach(p => {
            if (!permissionNames.includes(p.name)) {
              permissionNames.push(p.name);
            }
          });
        }
      }

      console.log('[AdminContext] Permissions fetched:', permissionNames.length, 'permissions');
      setPermissions([...new Set(permissionNames)]); // Remove duplicatas
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
