import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { VideoCard } from "@/components/VideoCard";
import { VideoPlayerModal } from "@/components/VideoPlayerModal";
import { 
  Video, 
  Search, 
  TrendingUp, 
  Clock, 
  Users,
  Loader2,
  Film
} from "lucide-react";
import SEO from "@/components/SEO";

interface VideoData {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  visibility: 'public' | 'private' | 'friends' | 'custom';
  views_count: number;
  likes_count: number;
  created_at: string;
  profiles?: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string | null;
  };
}

const Videos = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("recent");
  const [selectedVideo, setSelectedVideo] = useState<VideoData | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      setCurrentUserId(session.user.id);
      loadVideos();
    });
  }, [navigate]);

  const loadVideos = async (tab = activeTab) => {
    setLoading(true);
    try {
      // First get videos
      let query = supabase
        .from("user_videos")
        .select("*")
        .eq("visibility", "public");

      // Apply sorting based on tab
      if (tab === "recent") {
        query = query.order("created_at", { ascending: false });
      } else if (tab === "popular") {
        query = query.order("views_count", { ascending: false });
      } else if (tab === "friends") {
        query = query.order("created_at", { ascending: false });
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;

      // Fetch profiles for each video
      const videoData = data || [];
      const userIds = [...new Set(videoData.map(v => v.user_id))];
      
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .in("id", userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

      let filteredVideos = videoData.map(v => ({
        ...v,
        visibility: v.visibility as 'public' | 'private' | 'friends' | 'custom',
        profiles: profilesMap.get(v.user_id)
      })) as VideoData[];

      // Filter by friends if needed
      if (tab === "friends" && currentUserId) {
        const { data: friendships } = await supabase
          .from("friendships")
          .select("user_id_1, user_id_2")
          .or(`user_id_1.eq.${currentUserId},user_id_2.eq.${currentUserId}`);

        if (friendships) {
          const friendIds = friendships.map(f => 
            f.user_id_1 === currentUserId ? f.user_id_2 : f.user_id_1
          );
          filteredVideos = filteredVideos.filter(v => friendIds.includes(v.user_id));
        }
      }

      setVideos(filteredVideos);
    } catch (error) {
      console.error("Error loading videos:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os vídeos.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    loadVideos(tab);
  };

  const filteredVideos = videos.filter(video =>
    video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    video.profiles?.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col">
      <SEO
        path="/videos"
        title="Vídeos Cristãos"
        description="Assista vídeos cristãos, pregações e conteúdo de edificação da comunidade Aliança Kingdom."
      />
      <Header />
      <main className="flex-1 w-full max-w-6xl mx-auto py-6 px-4">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Video className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Vídeos</h1>
              <p className="text-sm text-muted-foreground">
                Explore vídeos da comunidade
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar vídeos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="recent" className="gap-2">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Recentes</span>
            </TabsTrigger>
            <TabsTrigger value="popular" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Populares</span>
            </TabsTrigger>
            <TabsTrigger value="friends" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Amigos</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredVideos.length === 0 ? (
          <Card className="p-12 text-center">
            <Film className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum vídeo encontrado</h3>
            <p className="text-muted-foreground">
              {activeTab === "friends" 
                ? "Seus amigos ainda não publicaram vídeos."
                : searchQuery 
                  ? "Tente buscar por outro termo."
                  : "Seja o primeiro a publicar um vídeo!"}
            </p>
            <Button 
              className="mt-4"
              onClick={() => navigate("/profile")}
            >
              Ir para meu perfil
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVideos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                onClick={() => setSelectedVideo(video)}
                showAuthor
              />
            ))}
          </div>
        )}

        {/* Video Player Modal */}
        <VideoPlayerModal
          video={selectedVideo}
          onClose={() => setSelectedVideo(null)}
          currentUserId={currentUserId}
          onVideoUpdate={() => loadVideos()}
        />
      </main>
    </div>
  );
};

export default Videos;
