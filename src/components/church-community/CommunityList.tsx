import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Church, Users, LogIn, LogOut, Crown, MapPin, Hash, RefreshCw } from "lucide-react";
import LocationFilter, { LocationFilters } from "./LocationFilter";
import RectAvatar from "@/components/RectAvatar";
import CommunityWelcomeModal from "./CommunityWelcomeModal";

interface Community {
  id: string;
  name: string;
  description: string | null;
  church_name: string;
  cover_image_url: string | null;
  banner_url?: string | null;
  main_verse?: string | null;
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
  const [welcomeCommunity, setWelcomeCommunity] = useState<Community | null>(null);

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

  // Abre o fluxo inteligente de boas-vindas (participação → ministérios → tempo)
  const handleJoin = (communityId: string) => {
    const community = communities.find(c => c.id === communityId) || myCommunities.find(c => c.id === communityId);
    if (community) setWelcomeCommunity(community);
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
      className="community-card relative overflow-hidden cursor-pointer group border-border/50 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-primary/20 hover:border-primary/50"
      onClick={() => (community.is_member ? onSelectCommunity(community.id) : handleJoin(community.id))}
    >
      {/* Brilho que atravessa o card no hover */}
      <div className="card-shine pointer-events-none absolute inset-0 z-20" aria-hidden />

      {/* Capa */}
      <div className="relative h-24 overflow-hidden">
        {community.banner_url || community.cover_image_url ? (
          <img
            src={community.banner_url || community.cover_image_url!}
            alt=""
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-purple-500/25 to-amber-500/30 transition-transform duration-500 group-hover:scale-110">
            <span className="absolute inset-0 flex items-center justify-center text-4xl opacity-25 select-none">⛪</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />

        {/* Membros — chama para a comunhão */}
        <Badge className="absolute top-2 right-2 gap-1 bg-background/85 text-foreground backdrop-blur-sm shadow border-0">
          <Users className="h-3 w-3 text-primary" />
          {community.member_count} {community.member_count === 1 ? "irmão" : "irmãos"}
        </Badge>

        {community.member_role === "admin" && (
          <Badge className="absolute top-2 left-2 gap-1 bg-amber-500/90 text-white backdrop-blur-sm shadow border-0">
            <Crown className="h-3 w-3" />
            Sua igreja
          </Badge>
        )}
      </div>

      {/* Identidade */}
      <CardContent className="relative -mt-9 pb-4">
        <div className="flex items-end gap-3">
          <div className="rounded-xl ring-2 ring-background shadow-lg transition-transform duration-300 group-hover:scale-105">
            <RectAvatar
              src={community.cover_image_url}
              fallback={community.name}
              size="md"
            />
          </div>
          <div className="min-w-0 flex-1 pb-0.5">
            <h3 className="font-bold text-lg leading-tight truncate group-hover:text-primary transition-colors">
              {community.name}
            </h3>
            <p className="text-xs text-muted-foreground truncate">⛪ {community.church_name}</p>
          </div>
        </div>

        {/* Localização + código */}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {(community.city || community.state) && (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/60 rounded-full px-2 py-0.5">
              <MapPin className="h-3 w-3 text-emerald-500" />
              {[community.city, community.state].filter(Boolean).join(", ")}
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/60 rounded-full px-2 py-0.5 font-mono">
            <Hash className="h-3 w-3" />
            {community.id.slice(0, 8)}
          </span>
        </div>

        {/* Versículo ou descrição — o toque de curiosidade */}
        <p className="text-sm text-muted-foreground italic mt-2 line-clamp-2 min-h-[20px]">
          {community.main_verse?.trim()
            ? `"${community.main_verse.replace(/^"|"$/g, "")}"`
            : community.description || "Uma comunidade esperando por você... 🙏"}
        </p>

        {/* Chamado à ação */}
        <div className="flex items-center gap-2 mt-3" onClick={e => e.stopPropagation()}>
          {showJoin ? (
            <Button
              className="flex-1 gap-2 bg-gradient-to-r from-primary via-primary to-purple-600 text-primary-foreground shadow-md transition-all group-hover:shadow-lg group-hover:shadow-primary/30"
              onClick={() => handleJoin(community.id)}
              disabled={joiningId === community.id}
            >
              <LogIn className="h-4 w-4" />
              {joiningId === community.id ? "Entrando..." : "Fazer Parte"}
              <span className="cta-arrow transition-transform duration-300">→</span>
            </Button>
          ) : (
            <>
              <Button
                className="flex-1 gap-2 bg-gradient-to-r from-primary via-primary to-purple-600 text-primary-foreground shadow-md transition-all group-hover:shadow-lg group-hover:shadow-primary/30"
                onClick={() => onSelectCommunity(community.id)}
              >
                Entrar na Comunidade
                <span className="cta-arrow transition-transform duration-300">→</span>
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="text-muted-foreground hover:text-destructive shrink-0"
                onClick={() => handleLeave(community.id)}
                disabled={joiningId === community.id}
                title="Sair da comunidade"
              >
                <LogOut className="h-4 w-4" />
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
      {/* Efeitos do card magnético */}
      <style>{`
        .card-shine {
          background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.35) 50%, transparent 60%);
          transform: translateX(-120%);
          transition: transform 0.7s ease;
        }
        .community-card:hover .card-shine { transform: translateX(120%); }
        .community-card:hover .cta-arrow { transform: translateX(4px); }
      `}</style>
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

      {/* Fluxo inteligente de entrada */}
      {welcomeCommunity && (
        <CommunityWelcomeModal
          open={!!welcomeCommunity}
          onOpenChange={(o) => !o && setWelcomeCommunity(null)}
          communityId={welcomeCommunity.id}
          communityName={welcomeCommunity.name}
          userId={userId}
          onJoined={() => {
            const id = welcomeCommunity.id;
            setWelcomeCommunity(null);
            loadCommunities();
            onSelectCommunity(id);
          }}
        />
      )}
    </Tabs>
  );
};

export default CommunityList;
