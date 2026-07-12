import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import UserAvatar from "@/components/UserAvatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Lock, Heart, Send, Church, MapPin, Camera, Users, Flag, MoreVertical, ShieldBan } from "lucide-react";
import { UserBadge } from "@/components/UserBadge";
import { FriendTestimonials } from "@/components/FriendTestimonials";
import { ProfileVideos } from "@/components/ProfileVideos";
import { ProfilePhotos } from "@/components/ProfilePhotos";
import { ReportUserModal } from "@/components/ReportUserModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import SEO from "@/components/SEO";

interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  bio: string;
  church_name: string;
  city: string;
  is_private: boolean;
  cover_image_url?: string;
  marital_status?: string;
}

interface Badge {
  badge_name: string;
  badge_icon: string;
  badge_color: string;
}

const RARITY_COLOR: Record<string, string> = {
  common: "#94a3b8",
  rare: "#38bdf8",
  epic: "#a855f7",
  legendary: "#f59e0b",
  mythic: "#f43f5e",
};

const mapUserBadges = (rows: any[] | null | undefined): Badge[] =>
  (rows || []).map((row) => ({
    badge_name: row.badges?.name || "",
    badge_icon: row.badges?.icon || "🏅",
    badge_color: RARITY_COLOR[row.badges?.rarity] || RARITY_COLOR.common,
  }));

interface FaithPost {
  id: string;
  content: string;
  created_at: string;
  profiles: {
    username: string;
    full_name: string;
    avatar_url: string;
  };
}

interface MutualFriend {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
}

const MARITAL_STATUS_LABELS: Record<string, string> = {
  solteiro: "Solteiro",
  solteira: "Solteira",
  casado: "Casado",
  casada: "Casada",
};

const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentUserId, setCurrentUserId] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [faithPosts, setFaithPosts] = useState<FaithPost[]>([]);
  const [isFriend, setIsFriend] = useState(false);
  const [requestStatus, setRequestStatus] = useState<string | null>(null);
  const [canView, setCanView] = useState(false);
  const [faithMessage, setFaithMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isContentVisible, setIsContentVisible] = useState(false);
  const [mutualFriends, setMutualFriends] = useState<MutualFriend[]>([]);
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setIsContentVisible(false);
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      setCurrentUserId(session.user.id);
      if (userId) {
        loadProfile(session.user.id, userId);
      }
    });
  }, [navigate, userId]);

  // Trigger animation after profile loads
  useEffect(() => {
    if (profile && !isLoading) {
      const timer = setTimeout(() => setIsContentVisible(true), 50);
      return () => clearTimeout(timer);
    }
  }, [profile, isLoading]);

  const loadProfile = async (currentId: string, profileId: string) => {
    setIsLoading(true);
    
    // Carregar perfil
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", profileId)
      .maybeSingle();

    if (profileData) {
      setProfile(profileData);

      // Verificar se são amigos
      const { data: friendshipData } = await supabase
        .from("friendships")
        .select("*")
        .or(
          `and(user_id_1.eq.${currentId < profileId ? currentId : profileId},user_id_2.eq.${currentId < profileId ? profileId : currentId})`
        )
        .maybeSingle();

      const areFriends = !!friendshipData;
      setIsFriend(areFriends);

      // Verificar status de pedido de amizade
      const { data: requestData } = await supabase
        .from("friend_requests")
        .select("status")
        .or(`and(sender_id.eq.${currentId},receiver_id.eq.${profileId}),and(sender_id.eq.${profileId},receiver_id.eq.${currentId})`)
        .maybeSingle();

      if (requestData) {
        setRequestStatus(requestData.status);
      }

      // Determinar se pode visualizar o perfil completo
      const canViewProfile = !profileData.is_private || areFriends;
      setCanView(canViewProfile);

      if (canViewProfile) {
        // Carregar badges
        const { data: badgesData } = await (supabase.from("user_badges" as any) as any)
          .select("unlocked_at, badges(name, icon, rarity)")
          .eq("user_id", profileId)
          .order("unlocked_at", { ascending: false })
          .limit(5);

        if (badgesData) {
          setBadges(mapUserBadges(badgesData));
        }

        // Carregar posts de fé
        const { data: postsData } = await supabase
          .from("faith_posts")
          .select(`
            id,
            content,
            created_at,
            profiles:author_id (username, full_name, avatar_url)
          `)
          .eq("recipient_id", profileId)
          .order("created_at", { ascending: false });

        if (postsData) {
          setFaithPosts(postsData as any);
        }
      }

      // Carregar amigos em comum (sempre, independente do perfil ser privado)
      await loadMutualFriends(currentId, profileId);
    }
    
    setIsLoading(false);
  };

  const loadMutualFriends = async (currentId: string, profileId: string) => {
    // Buscar amigos do usuário atual
    const { data: myFriendships } = await supabase
      .from("friendships")
      .select("user_id_1, user_id_2")
      .or(`user_id_1.eq.${currentId},user_id_2.eq.${currentId}`);

    // Buscar amigos do perfil visitado
    const { data: theirFriendships } = await supabase
      .from("friendships")
      .select("user_id_1, user_id_2")
      .or(`user_id_1.eq.${profileId},user_id_2.eq.${profileId}`);

    if (!myFriendships || !theirFriendships) return;

    // Extrair IDs dos meus amigos
    const myFriendIds = myFriendships.map(f => 
      f.user_id_1 === currentId ? f.user_id_2 : f.user_id_1
    );

    // Extrair IDs dos amigos deles
    const theirFriendIds = theirFriendships.map(f => 
      f.user_id_1 === profileId ? f.user_id_2 : f.user_id_1
    );

    // Encontrar IDs em comum
    const mutualIds = myFriendIds.filter(id => theirFriendIds.includes(id));

    if (mutualIds.length === 0) {
      setMutualFriends([]);
      return;
    }

    // Buscar perfis dos amigos em comum
    const { data: mutualProfiles } = await supabase
      .from("profiles")
      .select("id, full_name, username, avatar_url")
      .in("id", mutualIds)
      .limit(6);

    if (mutualProfiles) {
      setMutualFriends(mutualProfiles);
    }
  };

  const sendFriendRequest = async () => {
    if (!userId || !currentUserId) return;

    // Verificar se não está tentando adicionar a si mesmo
    if (userId === currentUserId) {
      toast({
        title: "Erro",
        description: "Você não pode enviar um pedido para si mesmo",
        variant: "destructive",
      });
      return;
    }

    // Verificar se já existe um pedido (qualquer status) - usando array para evitar erro com múltiplos registros
    const { data: existingRequests } = await supabase
      .from("friend_requests")
      .select("id, status, sender_id")
      .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${currentUserId})`);

    if (existingRequests && existingRequests.length > 0) {
      // Pegar o pedido mais recente ou o que foi enviado pelo usuário atual
      const myRequest = existingRequests.find(r => r.sender_id === currentUserId);
      const existingRequest = myRequest || existingRequests[0];

      if (existingRequest.status === "pending") {
        toast({
          title: "Pedido já enviado",
          description: "Aguarde a confirmação do outro usuário",
        });
        setRequestStatus("pending");
        return;
      } else if (existingRequest.status === "accepted") {
        toast({
          title: "Já são amigos",
          description: "Vocês já são amigos!",
        });
        setIsFriend(true);
        return;
      } else if (existingRequest.status === "rejected") {
        // Se foi rejeitado, atualiza para pendente novamente
        const { error } = await supabase
          .from("friend_requests")
          .update({ status: "pending", updated_at: new Date().toISOString() })
          .eq("id", existingRequest.id);

        if (error) {
          toast({
            title: "Erro",
            description: "Não foi possível reenviar o pedido. Tente novamente.",
            variant: "destructive",
          });
        } else {
          setRequestStatus("pending");
          toast({
            title: "Pedido reenviado! 🎉",
            description: "Aguarde a confirmação",
          });
        }
        return;
      }
    }

    // Verificar se já são amigos
    const { data: friendship } = await supabase
      .from("friendships")
      .select("id")
      .or(
        `and(user_id_1.eq.${currentUserId < userId ? currentUserId : userId},user_id_2.eq.${currentUserId < userId ? userId : currentUserId})`
      )
      .maybeSingle();

    if (friendship) {
      toast({
        title: "Já são amigos",
        description: "Vocês já são amigos!",
      });
      setIsFriend(true);
      return;
    }

    const { error } = await supabase.from("friend_requests").insert({
      sender_id: currentUserId,
      receiver_id: userId,
    });

    if (error) {
      console.error("Friend request error:", error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar o pedido. Tente novamente.",
        variant: "destructive",
      });
    } else {
      setRequestStatus("pending");
      toast({
        title: "Pedido enviado! 🎉",
        description: "Aguarde a confirmação",
      });
    }
  };

  const sendFaithPost = async () => {
    if (!userId || !faithMessage.trim()) return;

    const { error } = await supabase.from("faith_posts").insert({
      author_id: currentUserId,
      recipient_id: userId,
      content: faithMessage,
    });

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível enviar a palavra de fé",
        variant: "destructive",
      });
    } else {
      setFaithMessage("");
      toast({
        title: "Palavra de Fé enviada! ✨",
        description: "Sua mensagem foi compartilhada",
      });
      if (userId) loadProfile(currentUserId, userId);
    }
  };

  if (isLoading || !profile) {
    return (
      <div className="min-h-screen bg-gradient-hero">
        <Header />
        <main className="container py-0 sm:py-8 max-w-2xl px-0 sm:px-4">
          <Card className="shadow-divine overflow-hidden rounded-none sm:rounded-lg animate-pulse">
            {/* Skeleton Cover */}
            <div className="relative w-full aspect-[16/9] sm:aspect-[16/7] bg-muted" />
            <CardContent className="pt-14 sm:pt-20 space-y-4">
              <div className="h-4 bg-muted rounded w-3/4 mx-auto" />
              <div className="h-3 bg-muted rounded w-1/2 mx-auto" />
              <div className="h-20 bg-muted rounded mt-6" />
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <SEO
        path={`/profile/${userId}`}
        title={profile.full_name || profile.username}
        description={profile.bio || `Perfil de ${profile.full_name || profile.username} no Aliança Kingdom${profile.church_name ? ` — ${profile.church_name}` : ""}.`}
        image={profile.avatar_url || undefined}
        type="profile"
        noindex={profile.is_private}
      />
      <Header />
      <main className="container py-0 sm:py-8 max-w-2xl px-0 sm:px-4">
        <Card className={`shadow-divine overflow-hidden rounded-none sm:rounded-lg transition-all duration-500 ease-out ${
          isContentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          {/* Hero Cover Section */}
          <div className="relative w-full aspect-[16/9] sm:aspect-[16/7] bg-gradient-to-br from-primary/20 via-primary/10 to-background overflow-hidden">
            {/* Cover Image - show blurred for private profiles */}
            {profile.cover_image_url ? (
              <img
                src={profile.cover_image_url}
                alt={`Capa do perfil de ${profile.full_name}`}
                className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${
                  !canView ? 'blur-md scale-105' : ''
                }`}
                loading="lazy"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Camera className="h-12 w-12 text-muted-foreground/30" />
              </div>
            )}
            
            {/* Dark overlay for text legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
            
            {/* Privacy indicator */}
            {profile.is_private && !isFriend && (
              <div className="absolute top-3 right-3 z-10">
                <div className="flex items-center gap-1.5 bg-background/80 backdrop-blur-sm px-2 py-1 rounded-full text-xs text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  Privado
                </div>
              </div>
            )}
          </div>
          
          {/* Profile Info Section - Centered below cover */}
          <div className="relative px-4 sm:px-6">
            {/* Centered Avatar - overlapping cover */}
            <div className="flex flex-col items-center -mt-16 sm:-mt-20">
              <div className="relative">
                <div className={`ring-4 ring-background shadow-xl rounded-lg overflow-hidden transition-all duration-500 ${
                  !canView ? 'ring-muted-foreground/20' : ''
                }`}>
                  <UserAvatar
                    src={profile.avatar_url}
                    fallback={profile.full_name}
                    size="xl"
                    className={!canView ? 'blur-sm hover:scale-100' : ''}
                  />
                </div>
                {!canView && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-lg">
                    <Lock className="h-6 w-6 text-white drop-shadow-lg" />
                  </div>
                )}
              </div>
              
              {/* Name - centered below avatar */}
              <div className="text-center mt-4 space-y-1">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                  {profile.full_name}
                </h1>
              </div>
              
              {/* Badges - centered below name */}
              {canView && badges.length > 0 && (
                <div className="flex gap-2 flex-wrap justify-center mt-3">
                  {badges.map((badge, index) => (
                    <UserBadge
                      key={index}
                      icon={badge.badge_icon}
                      name={badge.badge_name}
                      color={badge.badge_color}
                      size="sm"
                    />
                  ))}
                </div>
              )}
              
              {/* Action buttons - centered */}
              <div className="flex items-center gap-2 mt-4">
                {canView && !isFriend && !requestStatus && (
                  <Button onClick={sendFriendRequest} className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Enviar Pedido de Amizade
                  </Button>
                )}
                {canView && requestStatus === "pending" && (
                  <Button disabled>
                    Pedido Enviado
                  </Button>
                )}
                
                {/* Options Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={() => setShowReportModal(true)}
                      className="text-orange-600"
                    >
                      <Flag className="h-4 w-4 mr-2" />
                      Denunciar usuário
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          <CardContent className="space-y-6 pt-6">
            {!canView ? (
              <div className="text-center py-12 space-y-6">
                <div className="w-20 h-20 mx-auto bg-muted rounded-full flex items-center justify-center">
                  <Lock className="h-10 w-10 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">
                    Este perfil é privado
                  </h3>
                  <p className="text-muted-foreground max-w-sm mx-auto">
                    Você não tem permissão para visualizar as informações deste usuário. 
                    Envie um pedido de amizade para ter acesso ao perfil completo.
                  </p>
                </div>
                {!requestStatus && !isFriend && (
                  <Button onClick={sendFriendRequest} className="gap-2" size="lg">
                    <UserPlus className="h-4 w-4" />
                    Enviar Pedido de Amizade
                  </Button>
                )}
                {requestStatus === "pending" && (
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground bg-muted/50 py-3 px-4 rounded-lg">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                    Pedido de amizade enviado. Aguardando confirmação...
                  </div>
                )}
              </div>
            ) : (
              <>
                {profile.bio && (
                  <div>
                    <h3 className="font-semibold mb-2">Sobre</h3>
                    <p className="text-muted-foreground">{profile.bio}</p>
                  </div>
                )}

                {/* Info Grid */}
                <div className="flex flex-wrap gap-4 text-sm">
                  {/* Estado Civil */}
                  {profile.marital_status && (
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-primary" />
                      <span className="text-muted-foreground">
                        {MARITAL_STATUS_LABELS[profile.marital_status] || profile.marital_status}
                      </span>
                    </div>
                  )}

                  {profile.church_name && (
                    <div className="flex items-center gap-2">
                      <Church className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{profile.church_name}</span>
                    </div>
                  )}

                  {profile.city && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{profile.city}</span>
                    </div>
                  )}
                </div>

                {/* Amigos em Comum Section */}
                {mutualFriends.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      Amigos em Comum ({mutualFriends.length})
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {mutualFriends.map((friend) => (
                        <div
                          key={friend.id}
                          onClick={() => navigate(`/user/${friend.id}`)}
                          className="flex flex-col items-center gap-1 cursor-pointer group"
                        >
                          <UserAvatar
                            src={friend.avatar_url}
                            fallback={friend.full_name}
                            size="sm"
                            className="group-hover:ring-2 ring-primary transition-all"
                          />
                          <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors truncate max-w-[60px]">
                            {friend.full_name.split(' ')[0]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {isFriend && (
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Heart className="h-4 w-4 text-red-500" />
                      Enviar Palavra de Fé
                    </h3>
                    <Textarea
                      placeholder="Escreva uma mensagem de apoio, fé ou amizade... ✨"
                      value={faithMessage}
                      onChange={(e) => setFaithMessage(e.target.value)}
                      rows={3}
                    />
                    <Button
                      onClick={sendFaithPost}
                      disabled={!faithMessage.trim()}
                      className="w-full gap-2"
                    >
                      <Send className="h-4 w-4" />
                      Enviar Palavra de Fé
                    </Button>
                  </div>
                )}

                {faithPosts.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold">Palavras de Fé Recebidas ✨</h3>
                    {faithPosts.map((post) => (
                      <Card key={post.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-start gap-3">
                            <UserAvatar
                              src={post.profiles.avatar_url}
                              fallback={post.profiles.full_name}
                              size="sm"
                            />
                            <div className="flex-1">
                              <p className="font-semibold text-sm">
                                {post.profiles.full_name}
                              </p>
                              <p className="mt-2">{post.content}</p>
                              <p className="text-xs text-muted-foreground mt-2">
                                {new Date(post.created_at).toLocaleDateString("pt-BR")}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Photos Section */}
                {userId && (
                  <ProfilePhotos
                    userId={userId}
                    isOwner={false}
                    isFriend={isFriend}
                  />
                )}

                {/* Videos Section */}
                {userId && (
                  <ProfileVideos
                    userId={userId}
                    isOwner={false}
                    isFriend={isFriend}
                  />
                )}

                {/* Friend Testimonials Section */}
                {userId && (
                  <FriendTestimonials
                    profileId={userId}
                    profileName={profile.full_name}
                    isOwnProfile={false}
                    isFriend={isFriend}
                    currentUserId={currentUserId}
                  />
                )}
              </>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Report User Modal */}
      {profile && userId && (
        <ReportUserModal
          open={showReportModal}
          onOpenChange={setShowReportModal}
          reportedUserId={userId}
          reportedUserName={profile.full_name}
          currentUserId={currentUserId}
        />
      )}
    </div>
  );
};

export default UserProfile;
