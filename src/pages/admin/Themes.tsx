import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdmin } from "@/contexts/AdminContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Palette, Crown, Gift, Trash2, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Theme {
  id: string;
  theme_key: string;
  theme_name: string;
  description: string;
  unlock_type: string;
  vip_tier_required: string | null;
  rarity: number;
  is_active: boolean;
  users_count?: number;
  users_using_now?: number;
}

interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  current_theme: string;
}

export default function AdminThemes() {
  const { isAdmin, hasPermission, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal de concessão de tema
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [grantReason, setGrantReason] = useState("");
  const [grantDuration, setGrantDuration] = useState<string>("lifetime");

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate("/");
      return;
    }

    if (isAdmin) {
      loadThemes();
    }
  }, [isAdmin, adminLoading, navigate]);

  const loadThemes = async () => {
    try {
      const { data, error } = await supabase
        .from("admin_theme_stats")
        .select("*")
        .order("users_count", { ascending: false });

      if (error) throw error;

      setThemes(data || []);
    } catch (error) {
      console.error("Erro ao carregar temas:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar temas.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, email, full_name, avatar_url")
        .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(10);

      if (error) throw error;

      const users = (data || []).map((item) => ({
        id: item.id,
        email: item.email || "",
        full_name: item.full_name || "Sem nome",
        avatar_url: item.avatar_url || "",
        current_theme: "default",
      }));

      setSearchResults(users);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
    }
  };

  const handleGrantTheme = async () => {
    if (!selectedUser || !selectedTheme) {
      toast({
        title: "Erro",
        description: "Selecione um usuário e um tema.",
        variant: "destructive",
      });
      return;
    }

    if (!hasPermission("themes.grant")) {
      toast({
        title: "Sem permissão",
        description: "Você não tem permissão para conceder temas.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error("Usuário não autenticado");

      // Calcular data de expiração
      let expiresAt = null;
      if (grantDuration !== "lifetime") {
        const days = parseInt(grantDuration);
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + days);
      }

      // Conceder tema (upsert: se o usuário já tinha o registro, apenas desbloqueia de novo)
      const { error } = await supabase.from("user_themes").upsert({
        user_id: selectedUser.id,
        theme_key: selectedTheme.theme_key,
        granted_by: currentUser.user.id,
        is_unlocked: true,
        unlocked_at: new Date().toISOString(),
        expires_at: expiresAt?.toISOString() || null,
        grant_reason: grantReason || "Concedido via admin panel",
      }, { onConflict: "user_id,theme_key" });

      if (error) throw error;

      toast({
        title: "Tema Concedido!",
        description: `${selectedTheme.theme_name} concedido para ${selectedUser.full_name}`,
      });

      // Reset modal
      setShowGrantModal(false);
      setSelectedTheme(null);
      setSelectedUser(null);
      setUserSearch("");
      setGrantReason("");
      setGrantDuration("lifetime");

      loadThemes();
    } catch (error: any) {
      console.error("Erro ao conceder tema:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível conceder tema.",
        variant: "destructive",
      });
    }
  };

  const handleRevokeTheme = async (themeId: string, userId: string) => {
    if (!hasPermission("themes.revoke")) {
      toast({
        title: "Sem permissão",
        description: "Você não tem permissão para revogar temas.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("user_themes")
        .update({ is_active: false, is_unlocked: false })
        .eq("theme_key", themeId)
        .eq("user_id", userId);

      if (error) throw error;

      toast({
        title: "Tema Revogado",
        description: "O tema foi removido do usuário.",
      });

      loadThemes();
    } catch (error: any) {
      console.error("Erro ao revogar tema:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível revogar tema.",
        variant: "destructive",
      });
    }
  };

  const getRarityBadge = (rarity: number) => {
    const rarities = [
      { level: 1, label: "Comum", color: "bg-gray-500" },
      { level: 2, label: "Incomum", color: "bg-green-500" },
      { level: 3, label: "Raro", color: "bg-blue-500" },
      { level: 4, label: "Épico", color: "bg-purple-500" },
      { level: 5, label: "Lendário", color: "bg-yellow-500" },
    ];

    const rarityData = rarities.find((r) => r.level === rarity) || rarities[0];

    return (
      <Badge className={`${rarityData.color} text-white`}>
        {rarityData.label}
      </Badge>
    );
  };

  const filteredThemes = themes.filter((theme) =>
    theme.theme_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    theme.theme_key.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (adminLoading || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Carregando temas...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Central de Temas VIP
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerenciar temas premium e concessões
            </p>
          </div>

          <div className="flex gap-2">
            <Badge variant="outline" className="text-lg px-4 py-2">
              <Palette className="h-4 w-4 mr-2" />
              {themes.length} Temas
            </Badge>
          </div>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar temas por nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* Themes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredThemes.map((theme) => (
            <Card key={theme.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="h-5 w-5 text-purple-600" />
                      {theme.theme_name}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      {theme.theme_key}
                    </p>
                  </div>
                  {getRarityBadge(theme.rarity)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {theme.description}
                </p>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-muted/50 rounded p-2">
                    <p className="text-muted-foreground text-xs">Possuem</p>
                    <p className="font-bold">{theme.users_count || 0}</p>
                  </div>
                  <div className="bg-muted/50 rounded p-2">
                    <p className="text-muted-foreground text-xs">Usando</p>
                    <p className="font-bold">{theme.users_using_now || 0}</p>
                  </div>
                </div>

                {/* Unlock Type */}
                <div className="flex gap-2 flex-wrap">
                  {theme.unlock_type === "vip_only" && (
                    <Badge variant="outline" className="text-xs">
                      <Crown className="h-3 w-3 mr-1" />
                      Apenas VIP
                    </Badge>
                  )}
                  {theme.vip_tier_required && (
                    <Badge variant="outline" className="text-xs">
                      {theme.vip_tier_required}
                    </Badge>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setSelectedTheme(theme);
                      setShowGrantModal(true);
                    }}
                    disabled={!hasPermission("themes.grant")}
                  >
                    <Gift className="h-3 w-3 mr-1" />
                    Conceder
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredThemes.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Nenhum tema encontrado.
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal de Concessão */}
      <Dialog open={showGrantModal} onOpenChange={setShowGrantModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-purple-600" />
              Conceder Tema: {selectedTheme?.theme_name}
            </DialogTitle>
            <DialogDescription>
              Conceda este tema premium para um usuário específico
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Busca de Usuário */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Buscar Usuário
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Digite nome ou email..."
                  value={userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value);
                    searchUsers(e.target.value);
                  }}
                  className="pl-9"
                />
              </div>

              {/* Resultados */}
              {searchResults.length > 0 && (
                <div className="mt-2 border rounded-lg max-h-64 overflow-y-auto">
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => {
                        setSelectedUser(user);
                        setSearchResults([]);
                        setUserSearch(user.full_name);
                      }}
                      className="w-full p-3 hover:bg-accent text-left flex items-center gap-3 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{user.full_name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {user.current_theme}
                      </Badge>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Usuário Selecionado */}
            {selectedUser && (
              <Card className="bg-muted/50">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <UserPlus className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">{selectedUser.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {selectedUser.email}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Duração */}
            <div>
              <label className="text-sm font-medium mb-2 block">Duração</label>
              <Select value={grantDuration} onValueChange={setGrantDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 dias</SelectItem>
                  <SelectItem value="30">30 dias</SelectItem>
                  <SelectItem value="90">90 dias</SelectItem>
                  <SelectItem value="365">1 ano</SelectItem>
                  <SelectItem value="lifetime">Vitalício</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Motivo */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Motivo (opcional)
              </label>
              <Input
                placeholder="Ex: Evento especial, recompensa..."
                value={grantReason}
                onChange={(e) => setGrantReason(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowGrantModal(false);
                setSelectedTheme(null);
                setSelectedUser(null);
                setUserSearch("");
                setGrantReason("");
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleGrantTheme} disabled={!selectedUser}>
              <Gift className="h-4 w-4 mr-2" />
              Conceder Tema
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
