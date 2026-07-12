import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserAvatar from "@/components/UserAvatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  MessageCircle, 
  Heart, 
  BookOpen, 
  Calendar,
  Users,
  Clock,
  ShieldBan,
  UserMinus,
  MoreVertical,
  Flag
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReportUserModal from "@/components/ReportUserModal";
import SEO from "@/components/SEO";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface FriendProfile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

interface Interaction {
  id: string;
  type: "comment" | "like" | "prayer" | "testimony" | "event";
  content: string;
  created_at: string;
  reference_id?: string;
}

interface CommonActivity {
  id: string;
  type: "event" | "prayer_group" | "community";
  name: string;
  participant_count: number;
}

interface MutualFriend {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

const FriendDetails = () => {
  const { friendId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [currentUserId, setCurrentUserId] = useState("");
  const [friend, setFriend] = useState<FriendProfile | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [commonActivities, setCommonActivities] = useState<CommonActivity[]>([]);
  const [mutualFriends, setMutualFriends] = useState<MutualFriend[]>([]);
  const [friendshipDate, setFriendshipDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [showUnfriendDialog, setShowUnfriendDialog] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [friendId]);

  const loadData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    
    setCurrentUserId(session.user.id);
    
    await Promise.all([
      loadFriendProfile(),
      loadInteractions(session.user.id),
      loadCommonActivities(session.user.id),
      loadMutualFriends(session.user.id),
      loadFriendshipDate(session.user.id),
    ]);
    
    setLoading(false);
  };

  const loadFriendProfile = async () => {
    if (!friendId) return;
    
    const { data } = await supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url, bio, created_at")
      .eq("id", friendId)
      .single();
    
    if (data) {
      setFriend(data);
    }
  };

  const loadInteractions = async (userId: string) => {
    if (!friendId) return;
    
    const interactionsList: Interaction[] = [];

    try {
      // Load comments on each other's posts
      const { data: postComments } = await supabase
        .from("post_comments")
        .select("id, content, created_at, post_id, user_id")
        .or(`user_id.eq.${userId},user_id.eq.${friendId}`)
        .order("created_at", { ascending: false })
        .limit(15);

      if (postComments) {
        // Get post owners
        const postIds = [...new Set(postComments.map(c => c.post_id))];
        const { data: posts } = await supabase
          .from("posts")
          .select("id, user_id")
          .in("id", postIds);

        const postOwnerMap = new Map(posts?.map(p => [p.id, p.user_id]) || []);

        postComments.forEach(comment => {
          const postOwner = postOwnerMap.get(comment.post_id);
          if (postOwner === userId || postOwner === friendId) {
            interactionsList.push({
              id: comment.id,
              type: "comment",
              content: comment.content,
              created_at: comment.created_at,
              reference_id: comment.post_id
            });
          }
        });
      }

      // Load testimony interactions
      const { data: testimonyComments } = await supabase
        .from("testimony_comments")
        .select("id, content, created_at, testimony_id, user_id")
        .or(`user_id.eq.${userId},user_id.eq.${friendId}`)
        .order("created_at", { ascending: false })
        .limit(15);

      if (testimonyComments) {
        const testimonyIds = [...new Set(testimonyComments.map(c => c.testimony_id))];
        const { data: testimonies } = await supabase
          .from("testimonies")
          .select("id, user_id")
          .in("id", testimonyIds);

        const testimonyOwnerMap = new Map(testimonies?.map(t => [t.id, t.user_id]) || []);

        testimonyComments.forEach(comment => {
          const testimonyOwner = testimonyOwnerMap.get(comment.testimony_id);
          if (testimonyOwner === userId || testimonyOwner === friendId) {
            interactionsList.push({
              id: comment.id,
              type: "testimony",
              content: comment.content,
              created_at: comment.created_at,
              reference_id: comment.testimony_id
            });
          }
        });
      }

      // Load faith posts between users
      const { data: faithPosts } = await supabase
        .from("faith_posts")
        .select("id, content, created_at, author_id, recipient_id")
        .or(`and(author_id.eq.${userId},recipient_id.eq.${friendId}),and(author_id.eq.${friendId},recipient_id.eq.${userId})`)
        .order("created_at", { ascending: false })
        .limit(10);

      faithPosts?.forEach(post => {
        interactionsList.push({
          id: post.id,
          type: "prayer",
          content: post.content,
          created_at: post.created_at
        });
      });
    } catch (error) {
      console.error("Error loading interactions:", error);
    }

    // Sort by date
    interactionsList.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    setInteractions(interactionsList.slice(0, 20));
  };

  const loadCommonActivities = async (userId: string) => {
    if (!friendId) return;
    
    const activities: CommonActivity[] = [];

    try {
      // Common events
      const { data: userEvents } = await supabase
        .from("event_participants")
        .select("event_id")
        .eq("user_id", userId);

      const { data: friendEvents } = await supabase
        .from("event_participants")
        .select("event_id")
        .eq("user_id", friendId);

      const userEventIds = userEvents?.map(e => e.event_id) || [];
      const friendEventIds = friendEvents?.map(e => e.event_id) || [];
      const commonEventIds = userEventIds.filter(id => friendEventIds.includes(id));

      if (commonEventIds.length > 0) {
        const { data: events } = await supabase
          .from("events")
          .select("id, title")
          .in("id", commonEventIds);

        events?.forEach(event => {
          activities.push({
            id: event.id,
            type: "event",
            name: event.title,
            participant_count: 0
          });
        });
      }

      // Common prayer groups
      const { data: userGroups } = await supabase
        .from("prayer_group_members")
        .select("group_id")
        .eq("user_id", userId);

      const { data: friendGroups } = await supabase
        .from("prayer_group_members")
        .select("group_id")
        .eq("user_id", friendId);

      const userGroupIds = userGroups?.map(g => g.group_id) || [];
      const friendGroupIds = friendGroups?.map(g => g.group_id) || [];
      const commonGroupIds = userGroupIds.filter(id => friendGroupIds.includes(id));

      if (commonGroupIds.length > 0) {
        const { data: groups } = await supabase
          .from("prayer_groups")
          .select("id, name, member_count")
          .in("id", commonGroupIds);

        groups?.forEach(group => {
          activities.push({
            id: group.id,
            type: "prayer_group",
            name: group.name,
            participant_count: group.member_count
          });
        });
      }
    } catch (error) {
      console.error("Error loading common activities:", error);
    }

    setCommonActivities(activities);
  };

  const loadMutualFriends = async (userId: string) => {
    if (!friendId) return;

    try {
      // Get user's friends
      const { data: userFriendships } = await supabase
        .from("friendships")
        .select("user_id_1, user_id_2")
        .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`);

      const userFriendIds = userFriendships?.map(f =>
        f.user_id_1 === userId ? f.user_id_2 : f.user_id_1
      ) || [];

      // Get friend's friends
      const { data: friendFriendships } = await supabase
        .from("friendships")
        .select("user_id_1, user_id_2")
        .or(`user_id_1.eq.${friendId},user_id_2.eq.${friendId}`);

      const friendFriendIds = friendFriendships?.map(f =>
        f.user_id_1 === friendId ? f.user_id_2 : f.user_id_1
      ) || [];

      // Find mutual
      const mutualIds = userFriendIds.filter(id => 
        friendFriendIds.includes(id) && id !== friendId
      );

      if (mutualIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", mutualIds.slice(0, 10));

        if (profiles) {
          setMutualFriends(profiles);
        }
      }
    } catch (error) {
      console.error("Error loading mutual friends:", error);
    }
  };

  const loadFriendshipDate = async (userId: string) => {
    if (!friendId) return;

    try {
      const { data } = await supabase
        .from("friendships")
        .select("created_at")
        .or(`and(user_id_1.eq.${userId},user_id_2.eq.${friendId}),and(user_id_1.eq.${friendId},user_id_2.eq.${userId})`)
        .single();

      if (data) {
        setFriendshipDate(data.created_at);
      }
    } catch (error) {
      console.error("Error loading friendship date:", error);
    }
  };

  const handleBlock = async () => {
    if (!friendId) return;

    try {
      const { error } = await supabase
        .from("blocked_users")
        .insert({
          blocker_id: currentUserId,
          blocked_id: friendId
        });

      if (error) throw error;

      toast({
        title: "Usuário bloqueado",
        description: "Este usuário não poderá mais interagir com você",
      });

      navigate("/friends");
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível bloquear o usuário",
        variant: "destructive",
      });
    }
  };

  const handleUnfriend = async () => {
    if (!friendId) return;

    try {
      const user1 = currentUserId < friendId ? currentUserId : friendId;
      const user2 = currentUserId < friendId ? friendId : currentUserId;

      const { error } = await supabase
        .from("friendships")
        .delete()
        .eq("user_id_1", user1)
        .eq("user_id_2", user2);

      if (error) throw error;

      toast({
        title: "Amizade desfeita",
        description: "Você não é mais amigo deste usuário",
      });

      navigate("/friends");
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível desfazer a amizade",
        variant: "destructive",
      });
    }
  };

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case "comment": return <MessageCircle className="h-4 w-4 text-blue-500" />;
      case "like": return <Heart className="h-4 w-4 text-red-500" />;
      case "prayer": return <BookOpen className="h-4 w-4 text-purple-500" />;
      case "testimony": return <Heart className="h-4 w-4 text-amber-500" />;
      case "event": return <Calendar className="h-4 w-4 text-green-500" />;
      default: return <MessageCircle className="h-4 w-4" />;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "event": return <Calendar className="h-5 w-5 text-green-500" />;
      case "prayer_group": return <Users className="h-5 w-5 text-purple-500" />;
      case "community": return <Users className="h-5 w-5 text-blue-500" />;
      default: return <Users className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex flex-col">
        <Header />
        <main className="flex-1 w-full max-w-2xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 md:py-8">
          <Card>
            <CardContent className="p-8">
              <div className="animate-pulse space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 rounded-full bg-muted" />
                  <div className="space-y-2">
                    <div className="h-6 w-40 bg-muted rounded" />
                    <div className="h-4 w-24 bg-muted rounded" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (!friend) {
    return (
      <div className="min-h-screen bg-gradient-hero flex flex-col">
        <Header />
        <main className="flex-1 w-full max-w-2xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 md:py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Amigo não encontrado</p>
              <Button onClick={() => navigate("/friends")} className="mt-4">
                Voltar
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col">
      <SEO path={`/friend/${friendId}`} title={friend.full_name} description={`Perfil de ${friend.full_name} no Aliança Kingdom.`} noindex />
      <Header />
      <main className="flex-1 w-full max-w-2xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 md:py-8 space-y-4">
        {/* Header with back button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>

        {/* Friend Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="shadow-divine overflow-hidden">
            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.2 }}
                  >
                    <UserAvatar
                      src={friend.avatar_url}
                      fallback={friend.full_name}
                      size="lg"
                      className="ring-4 ring-background shadow-lg"
                    />
                  </motion.div>
                  <div>
                    <h1 className="text-xl font-bold">{friend.full_name}</h1>
                    {friendshipDate && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        Amigos desde {format(new Date(friendshipDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                    )}
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate(`/profile/${friend.id}`)}>
                      Ver perfil completo
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => setShowReportModal(true)}
                      className="text-orange-600"
                    >
                      <Flag className="h-4 w-4 mr-2" />
                      Denunciar usuário
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setShowUnfriendDialog(true)}
                      className="text-amber-600"
                    >
                      <UserMinus className="h-4 w-4 mr-2" />
                      Desfazer amizade
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setShowBlockDialog(true)}
                      className="text-destructive"
                    >
                      <ShieldBan className="h-4 w-4 mr-2" />
                      Bloquear usuário
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {friend.bio && (
                <p className="mt-4 text-sm text-muted-foreground">{friend.bio}</p>
              )}
            </div>

            <CardContent className="p-0">
              <Tabs defaultValue="interactions" className="w-full">
                <TabsList className="w-full grid grid-cols-3 rounded-none border-b">
                  <TabsTrigger value="interactions">Interações</TabsTrigger>
                  <TabsTrigger value="activities">Atividades</TabsTrigger>
                  <TabsTrigger value="mutual">Amigos</TabsTrigger>
                </TabsList>

                <TabsContent value="interactions" className="p-4 space-y-3">
                  {interactions.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhuma interação recente
                    </p>
                  ) : (
                    <AnimatePresence>
                      {interactions.map((interaction, index) => (
                        <motion.div
                          key={interaction.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                        >
                          <div className="mt-1">
                            {getInteractionIcon(interaction.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm line-clamp-2">{interaction.content}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(interaction.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  )}
                </TabsContent>

                <TabsContent value="activities" className="p-4 space-y-3">
                  {commonActivities.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhuma atividade em comum
                    </p>
                  ) : (
                    <AnimatePresence>
                      {commonActivities.map((activity, index) => (
                        <motion.div
                          key={activity.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                        >
                          {getActivityIcon(activity.type)}
                          <div className="flex-1">
                            <p className="font-medium">{activity.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {activity.type === "event" ? "Evento" : 
                               activity.type === "prayer_group" ? "Grupo de Oração" : 
                               "Comunidade"}
                              {activity.participant_count > 0 && ` • ${activity.participant_count} membros`}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  )}
                </TabsContent>

                <TabsContent value="mutual" className="p-4">
                  {mutualFriends.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum amigo em comum
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <AnimatePresence>
                        {mutualFriends.map((mutual, index) => (
                          <motion.div
                            key={mutual.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => navigate(`/friend/${mutual.id}`)}
                            className="flex flex-col items-center gap-2 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                          >
                            <UserAvatar
                              src={mutual.avatar_url}
                              fallback={mutual.full_name}
                              size="sm"
                            />
                            <p className="text-sm font-medium text-center truncate w-full">
                              {mutual.full_name.split(" ")[0]}
                            </p>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </main>

      {/* Block Dialog */}
      <AlertDialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bloquear {friend.full_name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Ao bloquear este usuário:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Vocês deixarão de ser amigos</li>
                <li>Ele não poderá ver seu perfil</li>
                <li>Ele não poderá te enviar mensagens</li>
                <li>Ele não poderá te seguir</li>
              </ul>
              <p className="mt-2">Esta ação pode ser desfeita nas configurações.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBlock}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Bloquear
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unfriend Dialog */}
      <AlertDialog open={showUnfriendDialog} onOpenChange={setShowUnfriendDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desfazer amizade com {friend.full_name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Vocês deixarão de ser amigos e perderão acesso ao conteúdo privado um do outro.
              Você poderá enviar um novo pedido de amizade depois.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleUnfriend}
              className="bg-amber-600 text-white hover:bg-amber-700"
            >
              Desfazer amizade
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Report User Modal */}
      <ReportUserModal
        open={showReportModal}
        onOpenChange={setShowReportModal}
        reportedUserId={friend.id}
        reportedUserName={friend.full_name}
        currentUserId={currentUserId}
      />
    </div>
  );
};

export default FriendDetails;
