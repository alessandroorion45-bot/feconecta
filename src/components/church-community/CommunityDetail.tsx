import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Users, Vote, Star, Plus, Settings, Heart, Shield, Megaphone,
  Flame, TreeDeciduous, Camera, Pencil, Trash2, MoreVertical, Loader2, ImageOff,
} from "lucide-react";
import { ImageCropModal } from "@/components/ImageCropModal";
import EditCommunityModal from "./EditCommunityModal";
import CommunityMural from "./CommunityMural";
import CommunityCampaigns from "./CommunityCampaigns";
import CommunityTree from "./CommunityTree";
import CommunityActivity from "./CommunityActivity";
import VotingList from "./VotingList";
import LeaderEvaluations from "./LeaderEvaluations";
import CommunityMembers from "./CommunityMembers";
import CreateVotingModal from "./CreateVotingModal";
import ManageLeadersModal from "./ManageLeadersModal";
import MinistriesSelector from "./MinistriesSelector";
import CommunityPhotoUpload from "./CommunityPhotoUpload";
import AdminSettingsModal from "./AdminSettingsModal";
import AdminTransferVoting from "./AdminTransferVoting";

interface Community {
  id: string;
  name: string;
  description: string | null;
  church_name: string;
  cover_image_url: string | null;
  member_count: number;
  created_by: string;
  created_at?: string;
  city?: string | null;
  state?: string | null;
  banner_url?: string | null;
  main_verse?: string | null;
}

interface CommunityDetailProps {
  communityId: string;
  userId: string;
  onBack: () => void;
}

const CommunityDetail = ({ communityId, userId, onBack }: CommunityDetailProps) => {
  const [community, setCommunity] = useState<Community | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [myRole, setMyRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateVoting, setShowCreateVoting] = useState(false);
  const [showManageLeaders, setShowManageLeaders] = useState(false);
  const [showAdminSettings, setShowAdminSettings] = useState(false);
  const [activeTab, setActiveTab] = useState("mural");
  const [heroStats, setHeroStats] = useState({ ministries: 0, campaigns: 0 });
  const [showEditCommunity, setShowEditCommunity] = useState(false);
  const [bannerCropOpen, setBannerCropOpen] = useState(false);
  const [bannerImageSrc, setBannerImageSrc] = useState<string | null>(null);
  const [bannerUploading, setBannerUploading] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const isCreator = community?.created_by === userId;

  const handleBannerSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Arquivo inválido", description: "Selecione uma imagem (JPG, PNG ou WEBP).", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setBannerImageSrc(ev.target?.result as string);
      setBannerCropOpen(true);
    };
    reader.readAsDataURL(file);
    if (bannerInputRef.current) bannerInputRef.current.value = "";
  };

  const handleBannerCropped = async (blob: Blob) => {
    setBannerUploading(true);
    try {
      const filePath = `community-banners/banner-${communityId}-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("community-photos")
        .upload(filePath, blob, { contentType: "image/jpeg", upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("community-photos").getPublicUrl(filePath);

      const { error } = await (supabase as any)
        .from("church_communities")
        .update({ banner_url: urlData.publicUrl })
        .eq("id", communityId);
      if (error) throw error;

      setCommunity(prev => (prev ? { ...prev, banner_url: urlData.publicUrl } : prev));
      toast({ title: "✅ Capa atualizada!", description: "A nova capa da comunidade foi salva." });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar capa",
        description: /banner_url|column/i.test(error.message || "")
          ? "Aplique APLICAR_COMUNIDADE4_SQL.sql para ativar a capa."
          : error.message,
        variant: "destructive",
      });
    } finally {
      setBannerUploading(false);
      setBannerImageSrc(null);
    }
  };

  const removeBanner = async () => {
    const { error } = await (supabase as any)
      .from("church_communities")
      .update({ banner_url: null })
      .eq("id", communityId);
    if (!error) {
      setCommunity(prev => (prev ? { ...prev, banner_url: null } : prev));
      toast({ title: "Capa removida" });
    }
  };

  useEffect(() => {
    loadCommunity();
  }, [communityId, userId]);

  const loadCommunity = async () => {
    try {
      const { data: communityData, error: communityError } = await supabase
        .from("church_communities")
        .select("*")
        .eq("id", communityId)
        .single();

      if (communityError) throw communityError;
      setCommunity(communityData);

      const { data: membership, error: memberError } = await supabase
        .from("church_community_members")
        .select("role")
        .eq("community_id", communityId)
        .eq("user_id", userId)
        .eq("is_active", true)
        .single();

      if (!memberError && membership) {
        setIsAdmin(membership.role === "admin");
        setMyRole(membership.role);
      }

      // Estatísticas do hero (ministérios ativos e campanhas)
      const [ministriesRes, campaignsRes] = await Promise.allSettled([
        supabase
          .from("church_community_members")
          .select("ministries")
          .eq("community_id", communityId)
          .eq("is_active", true),
        (supabase as any)
          .from("community_campaigns")
          .select("id", { count: "exact", head: true })
          .eq("community_id", communityId)
          .eq("is_active", true),
      ]);
      const ministrySet = new Set<string>();
      if (ministriesRes.status === "fulfilled") {
        (ministriesRes.value.data || []).forEach((m: any) =>
          (m.ministries || []).forEach((min: string) => ministrySet.add(min))
        );
      }
      setHeroStats({
        ministries: ministrySet.size,
        campaigns: campaignsRes.status === "fulfilled" ? (campaignsRes.value as any).count || 0 : 0,
      });
    } catch (error) {
      console.error("Error loading community:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!community) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <p className="text-muted-foreground">Comunidade não encontrada.</p>
          <Button variant="outline" onClick={onBack} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <Button variant="ghost" onClick={onBack} className="shrink-0">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        {isAdmin && (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowManageLeaders(true)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Líderes
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowAdminSettings(true)}
              className="text-amber-600 border-amber-200 hover:bg-amber-50"
            >
              <Shield className="h-4 w-4 mr-2" />
              Admin
            </Button>
          </div>
        )}
      </div>

      {/* Hero da Comunidade */}
      <Card className="overflow-hidden border-primary/20">
        {/* Capa 16:9 */}
        <div className="relative group/banner" style={{ aspectRatio: "16 / 6" }}>
          {community.banner_url ? (
            <img
              src={community.banner_url}
              alt={`Capa de ${community.name}`}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover"
              style={{ objectPosition: "center" }}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-primary/15 to-amber-500/20">
              <div className="absolute inset-0 flex items-center justify-center text-5xl opacity-20 select-none" aria-hidden>
                ⛪
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />

          {/* Alterar/remover capa (somente criador, aparece no hover) */}
          {isCreator && (
            <div className="absolute top-2 right-12 flex gap-1.5 opacity-0 group-hover/banner:opacity-100 transition-opacity">
              <Button
                size="sm"
                variant="secondary"
                className="gap-1.5 bg-background/80 backdrop-blur-sm shadow"
                onClick={() => bannerInputRef.current?.click()}
                disabled={bannerUploading}
              >
                {bannerUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                Alterar Capa
              </Button>
              {community.banner_url && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="gap-1.5 bg-background/80 backdrop-blur-sm shadow text-destructive"
                  onClick={removeBanner}
                  title="Remover capa"
                >
                  <ImageOff className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          )}

          {/* Menu do criador */}
          {isCreator && (
            <div className="absolute top-2 right-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="secondary" className="h-8 w-8 bg-background/80 backdrop-blur-sm shadow">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowEditCommunity(true)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Editar Comunidade
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => bannerInputRef.current?.click()}>
                    <Camera className="h-4 w-4 mr-2" />
                    Alterar Capa
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowManageLeaders(true)}>
                    <Settings className="h-4 w-4 mr-2" />
                    Gerenciar Líderes
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowAdminSettings(true)} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir Comunidade
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          <input
            ref={bannerInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleBannerSelect}
          />
        </div>

        <CardContent className="relative -mt-12 pb-4">
          <div className="flex items-end gap-4 flex-wrap">
            <CommunityPhotoUpload
              communityId={community.id}
              currentImageUrl={community.cover_image_url}
              communityName={community.name}
              isAdmin={isAdmin}
              onUpdate={(newUrl) => setCommunity(prev => prev ? { ...prev, cover_image_url: newUrl } : null)}
            />
            <div className="flex-1 min-w-[200px] pb-1">
              <h2 className="text-2xl font-bold flex items-center gap-2 flex-wrap">
                {community.name}
                {isAdmin && <Badge className="bg-primary text-primary-foreground">Admin</Badge>}
              </h2>
              <p className="text-muted-foreground">
                ⛪ {community.church_name}
                {community.city && <span className="text-sm"> · {community.city}{community.state ? ` - ${community.state}` : ""}</span>}
              </p>
            </div>
          </div>

          {community.description && (
            <p className="text-sm text-muted-foreground mt-3">{community.description}</p>
          )}

          {/* Estatísticas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
            {[
              { emoji: "👥", value: community.member_count, label: "Membros" },
              { emoji: "🌿", value: heroStats.ministries, label: "Ministérios" },
              { emoji: "🔥", value: heroStats.campaigns, label: "Campanhas" },
              {
                emoji: "🕊️",
                value: community.created_at
                  ? Math.max(1, Math.floor((Date.now() - new Date(community.created_at).getTime()) / 86_400_000))
                  : "—",
                label: "Dias de comunhão",
              },
            ].map(({ emoji, value, label }) => (
              <div key={label} className="rounded-lg bg-muted/50 border border-border/50 px-3 py-2 text-center">
                <div className="text-lg font-bold">{emoji} {value}</div>
                <div className="text-[11px] text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>

          {/* Ações rápidas */}
          <div className="flex gap-2 mt-4 flex-wrap">
            <Button size="sm" className="gap-1.5 bg-gradient-to-r from-primary to-primary/80" onClick={() => setActiveTab("campaigns")}>
              <Flame className="h-4 w-4" />
              Campanhas
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setActiveTab("tree")}>
              <TreeDeciduous className="h-4 w-4" />
              Ver Árvore
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setActiveTab("ministries")}>
              <Heart className="h-4 w-4" />
              Ministérios
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setActiveTab("mural")}>
              <Megaphone className="h-4 w-4" />
              Mural
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Admin Transfer Voting */}
      <AdminTransferVoting communityId={communityId} userId={userId} />

      {/* Versículo da comunidade (escolhido pelo criador) ou mensagem padrão */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-3 text-center">
          <p className="text-primary text-sm italic">
            {community.main_verse?.trim()
              ? community.main_verse
              : '"Todos sois iguais em Cristo Jesus." — Gálatas 3:28'}
          </p>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="mural" className="gap-2">
              <Megaphone className="h-4 w-4" />
              Mural
            </TabsTrigger>
            <TabsTrigger value="tree" className="gap-2">
              <TreeDeciduous className="h-4 w-4" />
              Árvore
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="gap-2">
              <Flame className="h-4 w-4" />
              Campanhas
            </TabsTrigger>
            <TabsTrigger value="votings" className="gap-2">
              <Vote className="h-4 w-4" />
              Votações
            </TabsTrigger>
            <TabsTrigger value="evaluations" className="gap-2">
              <Star className="h-4 w-4" />
              Avaliações
            </TabsTrigger>
            <TabsTrigger value="ministries" className="gap-2">
              <Heart className="h-4 w-4" />
              Ministérios
            </TabsTrigger>
            <TabsTrigger value="members" className="gap-2">
              <Users className="h-4 w-4" />
              Membros
            </TabsTrigger>
          </TabsList>

          {activeTab === "votings" && (
            <Button 
              onClick={() => setShowCreateVoting(true)}
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Votação
            </Button>
          )}
        </div>

        <TabsContent value="mural" className="mt-6 space-y-4">
          <CommunityActivity communityId={communityId} />
          <CommunityMural communityId={communityId} userId={userId} myRole={myRole} />
        </TabsContent>

        <TabsContent value="tree" className="mt-6">
          <CommunityTree communityId={communityId} userId={userId} />
        </TabsContent>

        <TabsContent value="campaigns" className="mt-6">
          <CommunityCampaigns communityId={communityId} userId={userId} myRole={myRole} />
        </TabsContent>

        <TabsContent value="votings" className="mt-6">
          <VotingList communityId={communityId} userId={userId} />
        </TabsContent>

        <TabsContent value="evaluations" className="mt-6">
          <LeaderEvaluations communityId={communityId} userId={userId} />
        </TabsContent>

        <TabsContent value="ministries" className="mt-6">
          <MinistriesSelector communityId={communityId} userId={userId} />
        </TabsContent>

        <TabsContent value="members" className="mt-6">
          <CommunityMembers 
            communityId={communityId} 
            communityName={community.name}
            userId={userId} 
            isAdmin={isAdmin} 
          />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <CreateVotingModal
        open={showCreateVoting}
        onOpenChange={setShowCreateVoting}
        communityId={communityId}
        userId={userId}
        onSuccess={() => {
          setShowCreateVoting(false);
          // Refresh will happen via realtime
        }}
      />

      <ManageLeadersModal
        open={showManageLeaders}
        onOpenChange={setShowManageLeaders}
        communityId={communityId}
        userId={userId}
      />

      <AdminSettingsModal
        open={showAdminSettings}
        onOpenChange={setShowAdminSettings}
        communityId={communityId}
        communityName={community.name}
        userId={userId}
        isCreator={isCreator}
        onCommunityDeleted={onBack}
      />

      {/* Edição da comunidade (somente criador) */}
      <EditCommunityModal
        open={showEditCommunity}
        onOpenChange={setShowEditCommunity}
        community={community}
        onSaved={(patch) => setCommunity(prev => (prev ? { ...prev, ...patch } : prev))}
      />

      {/* Recorte da capa em 16:9 travado */}
      {bannerImageSrc && (
        <ImageCropModal
          open={bannerCropOpen}
          onOpenChange={(o) => {
            setBannerCropOpen(o);
            if (!o) setBannerImageSrc(null);
          }}
          imageSrc={bannerImageSrc}
          aspectRatio={16 / 9}
          onCropComplete={handleBannerCropped}
          title="Recortar Capa da Comunidade (16:9)"
        />
      )}
    </div>
  );
};

export default CommunityDetail;
