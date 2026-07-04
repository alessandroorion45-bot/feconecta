import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Church, Users, Vote, Star, Plus, Settings, Heart, Shield, Megaphone, Flame, TreeDeciduous } from "lucide-react";
import RectAvatar from "@/components/RectAvatar";
import CommunityMural from "./CommunityMural";
import CommunityCampaigns from "./CommunityCampaigns";
import CommunityTree from "./CommunityTree";
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

      {/* Community Info */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-4">
            <CommunityPhotoUpload
              communityId={community.id}
              currentImageUrl={community.cover_image_url}
              communityName={community.name}
              isAdmin={isAdmin}
              onUpdate={(newUrl) => setCommunity(prev => prev ? { ...prev, cover_image_url: newUrl } : null)}
            />
            <div className="flex-1">
              <CardTitle className="text-2xl flex items-center gap-2">
                {community.name}
                {isAdmin && (
                  <Badge className="bg-primary text-primary-foreground">Admin</Badge>
                )}
              </CardTitle>
              <CardDescription className="text-base">{community.church_name}</CardDescription>
            </div>
            <Badge variant="secondary" className="text-lg px-3 py-1 flex items-center gap-2">
              <Users className="h-4 w-4" />
              {community.member_count} membros
            </Badge>
          </div>
        </CardHeader>
        {community.description && (
          <CardContent>
            <p className="text-muted-foreground">{community.description}</p>
          </CardContent>
        )}
      </Card>

      {/* Active Admin Transfer Voting */}
      <AdminTransferVoting communityId={communityId} userId={userId} />

      {/* Spiritual Message */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-3 text-center">
          <p className="text-primary text-sm italic">
            "Todos sois iguais em Cristo Jesus." — Gálatas 3:28
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

        <TabsContent value="mural" className="mt-6">
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
        onCommunityDeleted={onBack}
      />
    </div>
  );
};

export default CommunityDetail;
