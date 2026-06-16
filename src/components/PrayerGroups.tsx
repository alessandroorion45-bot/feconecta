import { useState, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Users, Plus, LogIn, LogOut, Crown, Search, Copy, Check, Calendar, Link2, QrCode } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { User } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";
import SchedulePrayerModal from "./SchedulePrayerModal";
import ScheduledPrayerCard from "./ScheduledPrayerCard";
import PrayerGroupStats from "./PrayerGroupStats";

const categories = ["Saúde", "Família", "Trabalho", "Finanças", "Espiritual", "Missionário", "Jovens", "Casais"];

interface PrayerGroup {
  id: string;
  name: string;
  description: string | null;
  category: string;
  cover_image_url: string | null;
  created_by: string;
  is_public: boolean;
  member_count: number;
  created_at: string;
  invite_code: string | null;
}

interface ScheduledPrayer {
  id: string;
  group_id: string;
  created_by: string;
  title: string;
  description: string | null;
  scheduled_at: string;
  reminder_minutes: number;
  is_recurring: boolean;
  recurrence_type: string | null;
}

interface PrayerGroupsProps {
  user: User | null;
  onSelectGroup?: (groupId: string | null) => void;
  selectedGroupId?: string | null;
}

const PrayerGroups = ({ user, onSelectGroup, selectedGroupId }: PrayerGroupsProps) => {
  const [groups, setGroups] = useState<PrayerGroup[]>([]);
  const [userMemberships, setUserMemberships] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [groupDetailId, setGroupDetailId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [newGroup, setNewGroup] = useState({ name: "", description: "", category: "Espiritual" });
  const [loading, setLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [scheduledPrayers, setScheduledPrayers] = useState<ScheduledPrayer[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadGroups();
    if (user) {
      loadUserMemberships(user.id);
    }
  }, [user]);

  useEffect(() => {
    if (groupDetailId) {
      loadScheduledPrayers(groupDetailId);
    }
  }, [groupDetailId]);

  const loadGroups = async () => {
    const { data, error } = await supabase
      .from("prayer_groups")
      .select("*")
      .order("member_count", { ascending: false });

    if (!error && data) {
      setGroups(data as PrayerGroup[]);
    }
  };

  const loadUserMemberships = async (userId: string) => {
    const { data } = await supabase
      .from("prayer_group_members")
      .select("group_id")
      .eq("user_id", userId);

    if (data) {
      setUserMemberships(new Set(data.map(m => m.group_id)));
    }
  };

  const loadScheduledPrayers = async (groupId: string) => {
    const { data, error } = await supabase
      .from("scheduled_prayers")
      .select("*")
      .eq("group_id", groupId)
      .order("scheduled_at", { ascending: true });

    if (!error && data) {
      setScheduledPrayers(data as ScheduledPrayer[]);
    }
  };

  const handleCreateGroup = async () => {
    if (!user || !newGroup.name.trim()) {
      toast({
        title: "Preencha o nome",
        description: "O grupo precisa de um nome",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: group, error: groupError } = await supabase
        .from("prayer_groups")
        .insert([{
          name: newGroup.name.trim(),
          description: newGroup.description.trim() || null,
          category: newGroup.category,
          created_by: user.id,
        }])
        .select()
        .single();

      if (groupError) throw groupError;

      // Add creator as admin member
      await supabase
        .from("prayer_group_members")
        .insert([{
          group_id: group.id,
          user_id: user.id,
          role: "admin",
        }]);

      toast({
        title: "Grupo criado! 🙏",
        description: `Código de convite: ${group.invite_code}`,
      });

      setNewGroup({ name: "", description: "", category: "Espiritual" });
      setDialogOpen(false);
      loadGroups();
      loadUserMemberships(user.id);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível criar o grupo",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinByCode = async () => {
    if (!user || !inviteCode.trim()) {
      toast({
        title: "Digite o código",
        description: "Informe o código de convite do grupo",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Find group by invite code
      const { data: group, error: findError } = await supabase
        .from("prayer_groups")
        .select("id, name")
        .eq("invite_code", inviteCode.trim().toUpperCase())
        .single();

      if (findError || !group) {
        throw new Error("Código de convite inválido");
      }

      // Check if already a member
      if (userMemberships.has(group.id)) {
        toast({
          title: "Você já participa",
          description: `Você já faz parte do grupo "${group.name}"`,
        });
        setJoinDialogOpen(false);
        setInviteCode("");
        return;
      }

      // Join the group
      const { error: joinError } = await supabase
        .from("prayer_group_members")
        .insert([{
          group_id: group.id,
          user_id: user.id,
          role: "member",
        }]);

      if (joinError) throw joinError;

      toast({
        title: "Bem-vindo ao grupo! 🙏",
        description: `Você agora faz parte de "${group.name}"`,
      });

      setUserMemberships(prev => new Set(prev).add(group.id));
      setJoinDialogOpen(false);
      setInviteCode("");
      loadGroups();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Código inválido ou expirado",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    if (!user) {
      toast({
        title: "Faça login",
        description: "Você precisa estar logado para participar",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from("prayer_group_members")
        .insert([{
          group_id: groupId,
          user_id: user.id,
          role: "member",
        }]);

      if (error) throw error;

      toast({
        title: "Bem-vindo ao grupo! 🙏",
        description: "Você agora faz parte deste grupo de oração",
      });

      setUserMemberships(prev => new Set(prev).add(groupId));
      loadGroups();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível entrar no grupo",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    if (!user) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from("prayer_group_members")
        .delete()
        .eq("group_id", groupId)
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Você saiu do grupo",
        description: "Você não faz mais parte deste grupo de oração",
      });

      setUserMemberships(prev => {
        const next = new Set(prev);
        next.delete(groupId);
        return next;
      });
      
      if (selectedGroupId === groupId) {
        onSelectGroup?.(null);
      }
      if (groupDetailId === groupId) {
        setGroupDetailId(null);
      }
      
      loadGroups();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível sair do grupo",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyInviteCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      toast({
        title: "Código copiado! 📋",
        description: `Código ${code} copiado para a área de transferência`,
      });
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o código",
        variant: "destructive",
      });
    }
  };

  const handleShareLink = async (group: PrayerGroup) => {
    const shareUrl = `${window.location.origin}/prayers?join=${group.invite_code}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Grupo de Oração: ${group.name}`,
          text: `Entre no grupo de oração "${group.name}"! Use o código: ${group.invite_code}`,
          url: shareUrl,
        });
      } catch {
        // User cancelled sharing
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copiado!",
        description: "Link do grupo copiado para a área de transferência",
      });
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'saúde': return '❤️‍🩹';
      case 'família': return '👨‍👩‍👧‍👦';
      case 'trabalho': return '💼';
      case 'finanças': return '💰';
      case 'espiritual': return '✨';
      case 'missionário': return '🌍';
      case 'jovens': return '🌱';
      case 'casais': return '💑';
      default: return '🙏';
    }
  };

  const filteredGroups = groups.filter(group => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      group.name.toLowerCase().includes(query) ||
      group.description?.toLowerCase().includes(query) ||
      group.category.toLowerCase().includes(query)
    );
  });

  const selectedGroup = groupDetailId ? groups.find(g => g.id === groupDetailId) : null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Grupos de Oração</h2>
        </div>

        <div className="flex gap-2">
          {/* Join by Code Dialog */}
          {user && (
            <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="gap-2">
                  <QrCode className="h-4 w-4" />
                  Entrar com Código
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Link2 className="h-5 w-5 text-primary" />
                    Entrar com Código de Convite
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Digite o código (ex: ABC123XY)"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    maxLength={8}
                    className="text-center text-lg font-mono tracking-widest"
                  />
                  <Button 
                    onClick={handleJoinByCode} 
                    className="w-full bg-gradient-primary"
                    disabled={loading || inviteCode.length < 8}
                  >
                    {loading ? "Entrando..." : "Entrar no Grupo"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {/* Create Group Dialog */}
          {user && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Criar Grupo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Criar Grupo de Oração
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Nome do grupo"
                    value={newGroup.name}
                    onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                    maxLength={50}
                  />
                  <Select
                    value={newGroup.category}
                    onValueChange={(v) => setNewGroup({ ...newGroup, category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          <span className="flex items-center gap-2">
                            <span>{getCategoryIcon(cat)}</span>
                            {cat}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Textarea
                    placeholder="Descrição do grupo (opcional)"
                    value={newGroup.description}
                    onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                    rows={3}
                    maxLength={200}
                  />
                  <Button 
                    onClick={handleCreateGroup} 
                    className="w-full bg-gradient-primary"
                    disabled={loading}
                  >
                    {loading ? "Criando..." : "Criar Grupo"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar grupos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-9"
        />
      </div>

      {/* Group Detail View */}
      {selectedGroup && (
        <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-accent/5">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  {selectedGroup.created_by === user?.id && <Crown className="h-4 w-4 text-amber-500" />}
                  {selectedGroup.name}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">{selectedGroup.description}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setGroupDetailId(null)}>
                ✕
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Invite Code Section */}
            {selectedGroup.invite_code && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="text-xs text-muted-foreground">Código de Convite</p>
                  <p className="font-mono text-lg font-bold tracking-widest">{selectedGroup.invite_code}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopyInviteCode(selectedGroup.invite_code!)}
                  >
                    {copiedCode === selectedGroup.invite_code ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleShareLink(selectedGroup)}
                  >
                    <Link2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Group Statistics */}
            <PrayerGroupStats groupId={selectedGroup.id} />

            {/* Scheduled Prayers Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Orações Agendadas
                </h3>
                {user && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2"
                    onClick={() => setScheduleDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Agendar
                  </Button>
                )}
              </div>

              {scheduledPrayers.length > 0 ? (
                <div className="space-y-2">
                  {scheduledPrayers.map(prayer => (
                    <ScheduledPrayerCard
                      key={prayer.id}
                      prayer={prayer}
                      user={user}
                      onDelete={() => loadScheduledPrayers(groupDetailId!)}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma oração agendada ainda
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Groups List */}
      {!selectedGroup && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <AnimatePresence>
            {filteredGroups.map((group, index) => {
              const isMember = userMemberships.has(group.id);
              const isCreator = group.created_by === user?.id;
              const isSelected = selectedGroupId === group.id;

              return (
                <motion.div
                  key={group.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card 
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-md",
                      isSelected && "ring-2 ring-primary bg-primary/5",
                      isMember && !isSelected && "bg-muted/30"
                    )}
                    onClick={() => {
                      if (isMember) {
                        setGroupDetailId(group.id);
                        onSelectGroup?.(isSelected ? null : group.id);
                      }
                    }}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          {isCreator && <Crown className="h-4 w-4 text-amber-500" />}
                          {group.name}
                        </CardTitle>
                        <Badge variant="secondary" className="text-xs">
                          {getCategoryIcon(group.category)} {group.category}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-2">
                      {group.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {group.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {group.member_count} {group.member_count === 1 ? 'membro' : 'membros'}
                        </span>
                        {isMember && group.invite_code && (
                          <span className="flex items-center gap-1 font-mono">
                            <Link2 className="h-3 w-3" />
                            {group.invite_code}
                          </span>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0">
                      {!isMember ? (
                        <Button
                          size="sm"
                          className="w-full gap-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleJoinGroup(group.id);
                          }}
                          disabled={loading}
                        >
                          <LogIn className="h-4 w-4" />
                          Participar
                        </Button>
                      ) : !isCreator ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full gap-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLeaveGroup(group.id);
                          }}
                          disabled={loading}
                        >
                          <LogOut className="h-4 w-4" />
                          Sair
                        </Button>
                      ) : (
                        <div className="w-full text-center text-xs text-muted-foreground py-1">
                          Clique para ver detalhes
                        </div>
                      )}
                    </CardFooter>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {filteredGroups.length === 0 && !selectedGroup && (
        <div className="text-center py-8 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>{searchQuery ? "Nenhum grupo encontrado" : "Nenhum grupo criado ainda"}</p>
          {user && !searchQuery && (
            <p className="text-sm mt-1">Seja o primeiro a criar um grupo de oração!</p>
          )}
        </div>
      )}

      {/* Schedule Prayer Modal */}
      {user && groupDetailId && (
        <SchedulePrayerModal
          open={scheduleDialogOpen}
          onOpenChange={setScheduleDialogOpen}
          groupId={groupDetailId}
          user={user}
          onSuccess={() => loadScheduledPrayers(groupDetailId)}
        />
      )}
    </div>
  );
};

export default PrayerGroups;
