import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Church, Users, LogIn, LogOut, Crown, MapPin, Hash, RefreshCw } from "lucide-react";
import LocationFilter, { LocationFilters } from "./LocationFilter";
import RectAvatar from "@/components/RectAvatar";

interface Community {
  id: string;
  name: string;
  description: string | null;
  church_name: string;
  cover_image_url: string | null;
  member_count: number;
  created_by: string;
  created_at: string;
  country: string | null;
  state: string | null;
  city: string | null;
  address: string | null;
  is_member?: boolean;
  member_role?: string;
}

interface CommunityListProps {
  userId: string;
  searchQuery: string;
  onSelectCommunity: (id: string) => void;
  refreshTrigger?: number;
}

const CommunityList = ({ userId, searchQuery, onSelectCommunity, refreshTrigger }: CommunityListProps) => {
  const { toast } = useToast();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [myCommunities, setMyCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [locationFilters, setLocationFilters] = useState<LocationFilters>({ state: "", city: "" });

  useEffect(() => {
    loadCommunities();
  }, [userId, refreshTrigger]);

  // Real-time subscription for new communities
  useEffect(() => {
    if (!userId) return;
    
    const channel = supabase
      .channel('church-communities-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'church_communities'
        },
        (payload) => {
          // Add new community to list without full reload
          const newCommunity = payload.new as Community;
          setCommunities(prev => [{ ...newCommunity, is_member: false }, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const loadCommunities = async () => {
    setLoading(true);
    try {
      // Load all active communities ordered by creation date (newest first)
      const { data: allCommunities, error: allError } = await supabase
        .from("church_communities")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (allError) throw allError;

      // Load user's memberships
      const { data: memberships, error: memberError } = await supabase
        .from("church_community_members")
        .select("community_id, role, is_active")
        .eq("user_id", userId)
        .eq("is_active", true);

      if (memberError) throw memberError;

      const membershipMap = new Map(
        memberships?.map(m => [m.community_id, m.role]) || []
      );

      const enrichedCommunities = (allCommunities || []).map(c => ({
        ...c,
        is_member: membershipMap.has(c.id),
        member_role: membershipMap.get(c.id) || undefined,
      }));

      setCommunities(enrichedCommunities.filter(c => !c.is_member));
      setMyCommunities(enrichedCommunities.filter(c => c.is_member));
    } catch (error) {
      console.error("Error loading communities:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (communityId: string) => {
    setJoiningId(communityId);
    try {
      const { error } = await supabase
        .from("church_community_members")
        .insert({
          community_id: communityId,
          user_id: userId,
          role: "member",
        });

      if (error) throw error;

      toast({
        title: "✅ Bem-vindo à comunidade!",
        description: "Você agora faz parte desta comunidade.",
      });
      loadCommunities();
    } catch (error: any) {
      toast({
        title: "Erro ao entrar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setJoiningId(null);
    }
  };

  const handleLeave = async (communityId: string) => {
    setJoiningId(communityId);
    try {
      const { error } = await supabase
        .from("church_community_members")
        .update({ is_active: false, left_at: new Date().toISOString() })
        .eq("community_id", communityId)
        .eq("user_id", userId);

      if (error) throw error;

      toast({
        title: "Você saiu da comunidade",
        description: "Seu histórico foi mantido.",
      });
      loadCommunities();
    } catch (error: any) {
      toast({
        title: "Erro ao sair",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setJoiningId(null);
    }
  };

  const filterCommunities = (list: Community[]) => {
    let filtered = list;
    
    // Apply text search (name, church name, description, city, state, OR ID)
    if (searchQuery) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        c => 
          c.name.toLowerCase().includes(query) ||
          c.church_name.toLowerCase().includes(query) ||
          (c.description?.toLowerCase().includes(query)) ||
          (c.city?.toLowerCase().includes(query)) ||
          (c.state?.toLowerCase().includes(query)) ||
          c.id.toLowerCase().includes(query) // Search by ID
      );
    }
    
    // Apply location filters
    if (locationFilters.state) {
      filtered = filtered.filter(c => c.state === locationFilters.state);
    }
    if (locationFilters.city) {
      const cityQuery = locationFilters.city.toLowerCase();
      filtered = filtered.filter(c => c.city?.toLowerCase().includes(cityQuery));
    }
    
    return filtered;
  };

  const CommunityCard = ({ community, showJoin = false }: { community: Community; showJoin?: boolean }) => (
    <Card 
      className="hover:shadow-lg transition-all cursor-pointer group border-border/50 hover:border-primary/30"
      onClick={() => community.is_member && onSelectCommunity(community.id)}
    >
      <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <RectAvatar
                src={community.cover_image_url}
                fallback={community.name}
                size="md"
              />
            <div>
              <CardTitle className="text-lg group-hover:text-primary transition-colors flex items-center gap-2">
                {community.name}
                {community.member_role === "admin" && (
                  <Crown className="h-4 w-4 text-secondary" />
                )}
              </CardTitle>
              <CardDescription>{community.church_name}</CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {community.member_count}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Community ID */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2 font-mono">
          <Hash className="h-3 w-3" />
          <span className="truncate">{community.id.slice(0, 8)}</span>
        </div>
        
        {/* Location info */}
        {(community.city || community.state) && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
            <MapPin className="h-3 w-3" />
            <span>
              {[community.city, community.state].filter(Boolean).join(", ")}
            </span>
          </div>
        )}
        
        {community.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {community.description}
          </p>
        )}
        <div className="flex gap-2" onClick={e => e.stopPropagation()}>
          {showJoin ? (
            <Button 
              size="sm" 
              onClick={() => handleJoin(community.id)}
              disabled={joiningId === community.id}
            >
              <LogIn className="h-4 w-4 mr-1" />
              {joiningId === community.id ? "Entrando..." : "Entrar"}
            </Button>
          ) : (
            <>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onSelectCommunity(community.id)}
              >
                Acessar
              </Button>
              <Button 
                size="sm" 
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => handleLeave(community.id)}
                disabled={joiningId === community.id}
              >
                <LogOut className="h-4 w-4 mr-1" />
                Sair
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-muted" />
              <div className="h-4 w-32 bg-muted rounded mt-2" />
            </CardHeader>
            <CardContent>
              <div className="h-4 w-full bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <Tabs defaultValue="my" className="w-full">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <TabsList>
            <TabsTrigger value="my" className="gap-2">
              <Crown className="h-4 w-4" />
              Minhas ({myCommunities.length})
            </TabsTrigger>
            <TabsTrigger value="discover" className="gap-2">
              <Church className="h-4 w-4" />
              Descobrir ({communities.length})
            </TabsTrigger>
          </TabsList>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadCommunities}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
        
        {/* Location Filter */}
        <LocationFilter filters={locationFilters} onChange={setLocationFilters} />
      </div>

      <TabsContent value="my">
        {filterCommunities(myCommunities).length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Church className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">Você ainda não participa de nenhuma comunidade</h3>
              <p className="text-muted-foreground">
                Explore as comunidades disponíveis ou crie a sua própria.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filterCommunities(myCommunities).map(community => (
              <CommunityCard key={community.id} community={community} />
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="discover">
        {filterCommunities(communities).length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Church className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">Nenhuma comunidade encontrada</h3>
              <p className="text-muted-foreground">
                {locationFilters.state || locationFilters.city 
                  ? "Tente ajustar os filtros de localização."
                  : "Seja o primeiro a criar uma comunidade!"
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filterCommunities(communities).map(community => (
              <CommunityCard key={community.id} community={community} showJoin />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
};

export default CommunityList;
