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
    console.log('[AdminContext] loadPermissions called, user:', user?.id);

    if (!user) {
      console.log('[AdminContext] No user found, setting defaults');
      setUserRole(null);
      setPermissions([]);
      setLoading(false);
      return;
    }

    try {
      console.log('[AdminContext] Fetching roles DIRECTLY from user_roles table');
      console.log('[AdminContext] User ID:', user.id);

      // Buscar roles do usuário DIRETAMENTE (sem RPC) - com timeout
      const rolesPromise = supabase
        .from('user_roles')
        .select('role, is_active, expires_at')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('role', { ascending: true });

      // Timeout de 20 segundos (aumentado após adicionar índices)
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('ROLES_QUERY_TIMEOUT')), 20000)
      );

      const { data: rolesData, error: rolesError } = await Promise.race([
        rolesPromise,
        timeoutPromise
      ]).catch((err) => {
        console.error('[AdminContext] Query timeout or error:', err);
        return { data: null, error: err };
      }) as { data: any; error: any };

      if (rolesError) {
        console.error('[AdminContext] Error fetching roles:', rolesError);
        console.error('[AdminContext] Error details:', JSON.stringify(rolesError));
        // Não falhar - usar fallback
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

      // Buscar permissões DIRETAMENTE
      console.log('[AdminContext] Fetching permissions DIRECTLY');

      const { data: permissionsData, error: permissionsError } = await supabase
        .from('user_roles')
        .select(`
          role,
          role_permissions!inner (
            permissions!inner (
              name
            )
          )
        `)
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (permissionsError) {
        console.error('[AdminContext] Error fetching permissions:', permissionsError);
        // Não falhar se permissões não carregarem
      }

      const permissionNames: string[] = [];
      if (permissionsData) {
        permissionsData.forEach((roleItem: any) => {
          if (roleItem.role_permissions) {
            roleItem.role_permissions.forEach((rp: any) => {
              if (rp.permissions?.name) {
                permissionNames.push(rp.permissions.name);
              }
            });
          }
        });
      }

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
