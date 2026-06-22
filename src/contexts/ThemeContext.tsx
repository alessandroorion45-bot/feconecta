import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { themes, getTheme, applyTheme, type Theme } from "@/lib/themes";

interface ThemeContextType {
  currentTheme: Theme;
  activeThemeKey: string;
  availableThemes: ThemeData[];
  setTheme: (themeKey: string) => Promise<boolean>;
  refreshThemes: () => Promise<void>;
  loading: boolean;
}

interface ThemeData {
  theme_key: string;
  theme_name: string;
  description: string;
  colors: any;
  is_unlocked: boolean;
  is_active: boolean;
  rarity: number;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [currentTheme, setCurrentTheme] = useState<Theme>(themes.default);
  const [activeThemeKey, setActiveThemeKey] = useState<string>("default");
  const [availableThemes, setAvailableThemes] = useState<ThemeData[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUserTheme = async () => {
    if (!user) {
      // Usuário não logado: tema padrão
      setCurrentTheme(themes.default);
      setActiveThemeKey("default");
      applyTheme(themes.default);
      setAvailableThemes([]);
      setLoading(false);
      return;
    }

    try {
      // Buscar tema ativo do usuário
      const { data: activeThemeData, error: activeError } = await supabase
        .rpc("get_active_theme", { p_user_id: user.id });

      if (activeError) throw activeError;

      const themeKey = activeThemeData || "default";
      const theme = getTheme(themeKey);

      setCurrentTheme(theme);
      setActiveThemeKey(themeKey);
      applyTheme(theme);

      // Buscar temas disponíveis
      const { data: themesData, error: themesError } = await supabase
        .rpc("get_available_themes", { p_user_id: user.id });

      if (themesError) throw themesError;

      setAvailableThemes(themesData || []);
    } catch (error) {
      console.error("Erro ao carregar tema:", error);
      // Fallback para tema padrão
      setCurrentTheme(themes.default);
      setActiveThemeKey("default");
      applyTheme(themes.default);
    } finally {
      setLoading(false);
    }
  };

  const setTheme = async (themeKey: string): Promise<boolean> => {
    if (!user) {
      console.error("Usuário não logado");
      return false;
    }

    try {
      // Tentar ativar o tema
      const { error } = await supabase
        .rpc("set_active_theme", {
          p_user_id: user.id,
          p_theme_key: themeKey,
        });

      if (error) throw error;

      // Aplicar tema localmente
      const theme = getTheme(themeKey);
      setCurrentTheme(theme);
      setActiveThemeKey(themeKey);
      applyTheme(theme);

      // Atualizar lista de temas
      await refreshThemes();

      return true;
    } catch (error) {
      console.error("Erro ao ativar tema:", error);
      return false;
    }
  };

  const refreshThemes = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .rpc("get_available_themes", { p_user_id: user.id });

      if (error) throw error;
      setAvailableThemes(data || []);
    } catch (error) {
      console.error("Erro ao recarregar temas:", error);
    }
  };

  useEffect(() => {
    loadUserTheme();
  }, [user]);

  const value: ThemeContextType = {
    currentTheme,
    activeThemeKey,
    availableThemes,
    setTheme,
    refreshThemes,
    loading,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
