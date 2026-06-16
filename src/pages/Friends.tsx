import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import UserAvatar from "@/components/UserAvatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { UserPlus, UserMinus, Search, UserCheck, X, Check, Globe, Flag, RefreshCw, Users } from "lucide-react";
import { useLanguage, SOUTH_AMERICAN_COUNTRIES } from "@/contexts/LanguageContext";
import { FriendSuggestions } from "@/components/FriendSuggestions";
import { FriendRequestAnimation } from "@/components/FriendRequestAnimation";
import { motion, AnimatePresence } from "framer-motion";
import { LoadingFallback } from "@/components/LoadingFallback";
import { ErrorState } from "@/components/ErrorState";

const MAX_FRIENDS = 10000;
const QUERY_TIMEOUT_MS = 20000;

const withTimeout = async <T,>(promiseLike: PromiseLike<T>, timeoutMs = QUERY_TIMEOUT_MS): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error("Tempo limite excedido ao carregar dados. Verifique sua conexão."));
    }, timeoutMs);
  });
  try {
    return await Promise.race([Promise.resolve(promiseLike), timeoutPromise]);
  } finally {
    clearTimeout(timeoutId!);
  }
};

interface User {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  country?: string;
  is_following?: boolean;
  request_status?: string | null;
  is_friend?: boolean;
}

interface FriendRequest {
  id: string;
  sender_id: string;
  status: string;
  profiles: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string;
  };
}

const Friends = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const { t, language, userCountry } = useLanguage();
  const [currentUserCountry, setCurrentUserCountry] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [usersFromCountry, setUsersFromCountry] = useState<User[]>([]);
  const [usersFromOtherCountries, setUsersFromOtherCountries] = useState<User[]>([]);
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [showOtherCountries, setShowOtherCountries] = useState(false);
  const [animationType, setAnimationType] = useState<"received" | "accepted" | "sent" | null>(null);
  const [animationUserName, setAnimationUserName] = useState<string | undefined>();
  const [showAnimation, setShowAnimation] = useState(false);
  const [blockedUserIds, setBlockedUserIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState("friends");
  const [followersLoaded, setFollowersLoaded] = useState(false);
  const [followingLoaded, setFollowingLoaded] = useState(false);
  const reloadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentUserId = user?.id || "";

  // Presence subscription
  useEffect(() => {
    if (!user) return;
    const presenceChannel = supabase.channel('online-presence', {
      config: { presence: { key: user.id } }
    });
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        setOnlineUsers(new Set(Object.keys(presenceChannel.presenceState())));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({ user_id: user.id, online_at: new Date().toISOString() });
        }
      });
    return () => { supabase.removeChannel(presenceChannel); };
  }, [user]);

  // Lazy load followers/following when tab changes
  useEffect(() => {
    if (!currentUserId) return;
    if (activeTab === "following" && !followingLoaded) {
      loadFollowing(currentUserId);
    }
  }, [activeTab, currentUserId, followingLoaded]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setIsLoading(false);
      setLoadError("Sessão não encontrada. Faça login novamente.");
      navigate("/auth");
      return;
    }

    let channel: ReturnType<typeof supabase.channel> | null = null;
    let isActive = true;

    const initialize = async () => {
      const userId = user.id;
      try {
        setIsLoading(true);
        setLoadError(null);

        const { data: profile } = await withTimeout(
          supabase.from("profiles").select("country").eq("id", userId).maybeSingle()
        );
        if (!isActive) return;
        const uc = profile?.country || null;
        if (uc) setCurrentUserCountry(uc);

        await loadData(userId, uc);
        if (!isActive) return;

        channel = supabase
          .channel('friends-realtime')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'friend_requests', filter: `receiver_id=eq.${userId}` },
            async (payload) => {
              if (payload.eventType === 'INSERT') {
                const { data: sp } = await supabase.from("profiles").select("full_name").eq("id", (payload.new as any).sender_id).maybeSingle();
                setAnimationType("received");
                setAnimationUserName(sp?.full_name);
                setShowAnimation(true);
              }
              if (reloadTimerRef.current) clearTimeout(reloadTimerRef.current);
              reloadTimerRef.current = setTimeout(() => { void loadData(userId, uc); }, 500);
            }
          )
          .on('postgres_changes', { event: '*', schema: 'public', table: 'friend_requests', filter: `sender_id=eq.${userId}` },
            async (payload) => {
              if (payload.eventType === 'UPDATE' && (payload.new as any).status === 'accepted') {
                const { data: rp } = await supabase.from("profiles").select("full_name").eq("id", (payload.new as any).receiver_id).maybeSingle();
                setAnimationType("accepted");
                setAnimationUserName(rp?.full_name);
                setShowAnimation(true);
              }
              if (reloadTimerRef.current) clearTimeout(reloadTimerRef.current);
              reloadTimerRef.current = setTimeout(() => { void loadData(userId, uc); }, 500);
            }
          )
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'friendships' },
            (payload) => {
              const nf = payload.new as { user_id_1: string; user_id_2: string };
              if (nf.user_id_1 === userId || nf.user_id_2 === userId) {
                if (reloadTimerRef.current) clearTimeout(reloadTimerRef.current);
                reloadTimerRef.current = setTimeout(() => { void loadData(userId, uc); }, 500);
              }
            }
          )
          .subscribe();
      } catch (error) {
        if (isActive) {
          setLoadError(error instanceof Error ? error.message : "Falha ao inicializar");
          setIsLoading(false);
        }
      }
    };

    void initialize();
    return () => {
      isActive = false;
      if (channel) supabase.removeChannel(channel);
      if (reloadTimerRef.current) clearTimeout(reloadTimerRef.current);
    };
  }, [authLoading, user, navigate]);

  const loadData = useCallback(async (userId: string, country: string | null = null) => {
    if (!userId) { setIsLoading(false); setLoadError("Usuário não autenticado"); return; }

    try {
      setLoadError(null);

      // Single friendships query shared across functions
      const [blockedResult, friendshipsResult, requestsResult] = await Promise.all([
        withTimeout(loadBlockedUsers(userId)).catch(e => { console.error("blocked err:", e); return new Set<string>(); }),
        withTimeout(supabase.from("friendships").select("user_id_1, user_id_2").or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`)).catch(() => ({ data: null })),
        withTimeout(supabase.from("friend_requests").select("id, sender_id, status, profiles:sender_id (id, username, full_name, avatar_url)").eq("receiver_id", userId).eq("status", "pending")).catch(() => ({ data: null })),
      ]);

      const blockedIds = blockedResult instanceof Set ? blockedResult : new Set<string>();
      const friendships = (friendshipsResult as any)?.data || [];
      const friendIds = new Set<string>(friendships.map((f: any) => f.user_id_1 === userId ? f.user_id_2 : f.user_id_1));

      // Set friend requests
      if ((requestsResult as any)?.data) {
        setFriendRequests((requestsResult as any).data as any);
      }

      // Load friend profiles
      const friendIdArray = Array.from(friendIds);
      if (friendIdArray.length > 0) {
        const { data: friendProfiles } = await withTimeout(
          supabase.from("profiles").select("id, username, full_name, avatar_url").in("id", friendIdArray)
        ).catch(() => ({ data: null }));
        if (friendProfiles) setFriends(friendProfiles);
      } else {
        setFriends([]);
      }

      // Load discover users with shared friendships data (no duplicate query)
      await withTimeout(loadUsersWithSharedData(userId, country, blockedIds, friendIds)).catch(e => {
        console.error("loadUsers err:", e);
      });

    } catch (error: any) {
      console.error("Error loading data:", error);
      setLoadError(error.message || "Erro ao carregar dados");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadBlockedUsers = async (userId: string): Promise<Set<string>> => {
    try {
      const [blocked, blockedBy] = await Promise.all([
        supabase.from("blocked_users").select("blocked_id").eq("blocker_id", userId),
        supabase.from("blocked_users").select("blocker_id").eq("blocked_id", userId),
      ]);
      const ids = new Set([
        ...(blocked.data?.map(b => b.blocked_id) || []),
        ...(blockedBy.data?.map(b => b.blocker_id) || [])
      ]);
      setBlockedUserIds(ids);
      return ids;
    } catch { return new Set<string>(); }
  };

  const loadUsersWithSharedData = async (userId: string, userCountryCode: string | null, blockedIds: Set<string>, friendIds: Set<string>) => {
    const [profilesResult, followingResult, requestsSentResult, requestsReceivedResult] = await Promise.all([
      supabase.from("profiles").select("id, username, full_name, avatar_url, country").neq("id", userId).limit(100),
      supabase.from("followers").select("following_id").eq("follower_id", userId),
      supabase.from("friend_requests").select("receiver_id, status").eq("sender_id", userId),
      supabase.from("friend_requests").select("sender_id, status").eq("receiver_id", userId),
    ]);

    const data = profilesResult.data;
    if (!data) return;

    const filteredData = data.filter(u => !blockedIds.has(u.id));
    const followingIds = new Set(followingResult.data?.map(f => f.following_id) || []);
    const requestsSentMap = new Map(requestsSentResult.data?.map(r => [r.receiver_id, r.status]));
    const requestsReceivedMap = new Map(requestsReceivedResult.data?.map(r => [r.sender_id, r.status]));

    const processedUsers = filteredData.map(u => {
      const sentStatus = requestsSentMap.get(u.id);
      const receivedStatus = requestsReceivedMap.get(u.id);
      const requestStatus = sentStatus === "pending" ? "pending" :
                            receivedStatus === "pending" ? "pending_received" : null;
      return { ...u, is_following: followingIds.has(u.id), request_status: requestStatus, is_friend: friendIds.has(u.id) };
    });

    if (userCountryCode) {
      setUsersFromCountry(processedUsers.filter(u => u.country === userCountryCode));
      setUsersFromOtherCountries(processedUsers.filter(u => u.country !== userCountryCode));
    } else {
      setUsersFromCountry([]);
      setUsersFromOtherCountries(processedUsers);
    }
    setUsers(processedUsers);
  };

  const loadFollowing = async (userId: string) => {
    try {
      const { data } = await withTimeout(
        supabase.from("followers").select("following_id, profiles:following_id (id, username, full_name, avatar_url)").eq("follower_id", userId)
      );
      if (data) setFollowing(data.map((f: any) => f.profiles));
      setFollowingLoaded(true);
    } catch (e) { console.error("loadFollowing err:", e); }
  };

  const handleFriendRequest = async (requestId: string, action: "accept" | "reject") => {
    // Optimistic: remove from list immediately
    const request = friendRequests.find(r => r.id === requestId);
    setFriendRequests(prev => prev.filter(r => r.id !== requestId));

    if (action === "accept" && request) {
      // Optimistic: add to friends immediately
      setFriends(prev => [...prev, {
        id: request.profiles.id,
        username: request.profiles.username,
        full_name: request.profiles.full_name,
        avatar_url: request.profiles.avatar_url,
      }]);
    }

    try {
      const { data: requestData, error: fetchError } = await supabase
        .from("friend_requests").select("sender_id, receiver_id").eq("id", requestId).single();
      if (fetchError || !requestData) throw new Error("Não foi possível encontrar o pedido");

      const { error: updateError } = await supabase
        .from("friend_requests")
        .update({ status: action === "accept" ? "accepted" : "rejected", updated_at: new Date().toISOString() })
        .eq("id", requestId);
      if (updateError) throw updateError;

      // Trigger handles friendship creation, but ensure as fallback
      if (action === "accept") {
        const user1 = requestData.sender_id < requestData.receiver_id ? requestData.sender_id : requestData.receiver_id;
        const user2 = requestData.sender_id < requestData.receiver_id ? requestData.receiver_id : requestData.sender_id;
        const { data: existing } = await supabase.from("friendships").select("id").eq("user_id_1", user1).eq("user_id_2", user2).maybeSingle();
        if (!existing) {
          await supabase.from("friendships").insert({ user_id_1: user1, user_id_2: user2 });
        }
      }

      toast({
        title: action === "accept" ? "Pedido aceito! 🎉" : "Pedido rejeitado",
        description: action === "accept" ? "Agora vocês são amigos!" : "Pedido de amizade rejeitado",
      });

      // Background sync after 2s
      setTimeout(() => { void loadData(currentUserId, currentUserCountry); }, 2000);
    } catch (error: any) {
      // Revert optimistic update
      if (request) setFriendRequests(prev => [...prev, request]);
      if (action === "accept" && request) setFriends(prev => prev.filter(f => f.id !== request.profiles.id));
      toast({ title: "Erro", description: error.message || "Não foi possível processar o pedido", variant: "destructive" });
    }
  };

  const toggleFollow = async (userId: string) => {
    const u = users.find(x => x.id === userId);
    if (!u) return;
    try {
      if (u.is_following) {
        await supabase.from("followers").delete().eq("follower_id", currentUserId).eq("following_id", userId);
        toast({ title: "Deixou de seguir", description: `Você deixou de seguir @${u.username}` });
      } else {
        await supabase.from("followers").insert({ follower_id: currentUserId, following_id: userId });
        await supabase.from("notifications").insert({ user_id: userId, actor_id: currentUserId, type: "follow", content: `@${u.username} começou a seguir você` });
        toast({ title: "Seguindo", description: `Você agora segue @${u.username}` });
      }
      // Optimistic toggle
      setUsers(prev => prev.map(x => x.id === userId ? { ...x, is_following: !x.is_following } : x));
      setUsersFromCountry(prev => prev.map(x => x.id === userId ? { ...x, is_following: !x.is_following } : x));
      setUsersFromOtherCountries(prev => prev.map(x => x.id === userId ? { ...x, is_following: !x.is_following } : x));
      setFollowingLoaded(false); // Force reload on next tab visit
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const sendFriendRequest = async (targetUserId: string) => {
    const u = users.find(x => x.id === targetUserId);
    if (!u) return;

    if (friends.length >= MAX_FRIENDS) {
      toast({ title: t('friends.friendLimit'), description: `Você atingiu o limite máximo de ${MAX_FRIENDS.toLocaleString()} amigos`, variant: "destructive" });
      return;
    }
    if (u.is_friend) {
      toast({ title: "Já são amigos", description: `Você já é amigo de @${u.username}` });
      return;
    }

    // Optimistic update
    const updateRequestStatus = (prev: User[]) => prev.map(x => x.id === targetUserId ? { ...x, request_status: 'pending' } : x);
    setUsers(updateRequestStatus);
    setUsersFromCountry(updateRequestStatus);
    setUsersFromOtherCountries(updateRequestStatus);

    const { error } = await supabase.from("friend_requests").insert({ sender_id: currentUserId, receiver_id: targetUserId });

    if (error) {
      // Revert optimistic
      const revert = (prev: User[]) => prev.map(x => x.id === targetUserId ? { ...x, request_status: null } : x);
      setUsers(revert);
      setUsersFromCountry(revert);
      setUsersFromOtherCountries(revert);

      if (error.code === "23505") {
        toast({ title: "Pedido já enviado", description: "Aguarde a confirmação do outro usuário" });
      } else {
        toast({ title: "Erro", description: "Não foi possível enviar o pedido", variant: "destructive" });
      }
    } else {
      toast({ title: "Pedido enviado! 🎉", description: `Pedido de amizade enviado para @${u.username}` });
      // No full reload needed - optimistic update already applied
    }
  };

  const getCountryName = (code: string) => {
    const country = SOUTH_AMERICAN_COUNTRIES.find(c => c.code === code);
    return country?.name || code;
  };

  const filteredUsersFromCountry = usersFromCountry.filter(u =>
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) || u.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredUsersFromOther = usersFromOtherCountries.filter(u =>
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) || u.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRetry = () => {
    setIsLoading(true);
    setLoadError(null);
    if (currentUserId) loadData(currentUserId, currentUserCountry);
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col">
      <Header />
      
      <FriendRequestAnimation
        type={animationType || "received"}
        userName={animationUserName}
        show={showAnimation}
        onComplete={() => setShowAnimation(false)}
      />

      <main className="flex-1 w-full max-w-2xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 md:py-8 space-y-4">
        {isLoading && (
          <Card className="shadow-divine">
            <LoadingFallback message="Carregando amigos..." />
          </Card>
        )}

        {!isLoading && loadError && (
          <Card className="shadow-divine">
            <ErrorState title="Erro ao carregar" message={loadError} onRetry={handleRetry} isNetworkError={loadError.includes("fetch") || loadError.includes("network")} />
          </Card>
        )}

        {!isLoading && !loadError && (
          <>
            {currentUserId && (
              <FriendSuggestions currentUserId={currentUserId} onRequestSent={() => loadData(currentUserId, currentUserCountry)} />
            )}

            <Card className="shadow-divine">
              <CardHeader>
                <CardTitle className="flex items-center justify-between leading-tight">
                  <span className="pt-1">Amigos e Seguidores</span>
                  <AnimatePresence>
                    {friendRequests.length > 0 && (
                      <motion.span initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
                        className="text-sm font-normal bg-primary text-primary-foreground px-3 py-1 rounded-full">
                        {friendRequests.length} {friendRequests.length === 1 ? "pedido" : "pedidos"}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="friends">Amigos ({friends.length})</TabsTrigger>
                    <TabsTrigger value="requests" className="relative">
                      Pedidos
                      <AnimatePresence>
                        {friendRequests.length > 0 && (
                          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                            className="ml-1 bg-primary text-primary-foreground rounded-full px-2 text-xs">
                            {friendRequests.length}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </TabsTrigger>
                    <TabsTrigger value="following">Seguindo ({following.length})</TabsTrigger>
                    <TabsTrigger value="discover">Descobrir</TabsTrigger>
                  </TabsList>

                  <TabsContent value="friends" className="space-y-3">
                    {friends.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">Você ainda não tem amigos. Envie pedidos de amizade!</p>
                    ) : (
                      <AnimatePresence>
                        {friends.map((friend, index) => (
                          <motion.div key={friend.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ delay: index * 0.05 }}
                            className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 hover:border-primary/30 transition-all duration-300 group"
                            onClick={() => navigate(`/friend/${friend.id}`)}>
                            <div className="relative">
                              <UserAvatar src={friend.avatar_url} fallback={friend.full_name} size="sm"
                                className="ring-2 ring-transparent group-hover:ring-primary/30 transition-all" />
                              {onlineUsers.has(friend.id) && (
                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold group-hover:text-primary transition-colors">
                                {friend.full_name}
                                {onlineUsers.has(friend.id) && (
                                  <span className="ml-2 text-xs font-normal text-green-500">online</span>
                                )}
                              </p>
                              <p className="text-sm text-muted-foreground">@{friend.username}</p>
                            </div>
                            <UserCheck className="h-5 w-5 text-primary" />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    )}
                  </TabsContent>

                  <TabsContent value="requests" className="space-y-3">
                    {friendRequests.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">Nenhum pedido de amizade pendente</p>
                    ) : (
                      <AnimatePresence mode="popLayout">
                        {friendRequests.map((request, index) => (
                          <motion.div key={request.id} initial={{ opacity: 0, x: -20, scale: 0.95 }} animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 20, scale: 0.9 }} transition={{ delay: index * 0.1, type: "spring", stiffness: 300 }} layout
                            className="flex items-center gap-3 p-3 rounded-lg border bg-gradient-to-r from-primary/5 to-transparent hover:from-primary/10 transition-all duration-300">
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: index * 0.1 + 0.2, type: "spring" }}>
                              <UserAvatar src={request.profiles.avatar_url} fallback={request.profiles.full_name} size="sm" className="ring-2 ring-primary/20" />
                            </motion.div>
                            <div className="flex-1">
                              <p className="font-semibold">{request.profiles.full_name}</p>
                              <p className="text-sm text-muted-foreground">@{request.profiles.username}</p>
                            </div>
                            <div className="flex gap-2">
                              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Button size="sm" onClick={() => handleFriendRequest(request.id, "accept")}
                                  className="gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600">
                                  <Check className="h-4 w-4" /> Aceitar
                                </Button>
                              </motion.div>
                              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Button variant="outline" size="sm" onClick={() => handleFriendRequest(request.id, "reject")}
                                  className="hover:bg-destructive/10 hover:border-destructive/50">
                                  <X className="h-4 w-4" />
                                </Button>
                              </motion.div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    )}
                  </TabsContent>

                  <TabsContent value="following" className="space-y-3">
                    {!followingLoaded ? (
                      <LoadingFallback message="Carregando..." />
                    ) : following.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">Você ainda não segue ninguém</p>
                    ) : (
                      following.map((u) => (
                        <div key={u.id} className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50"
                          onClick={() => navigate(`/profile/${u.id}`)}>
                          <UserAvatar src={u.avatar_url} fallback={u.full_name} size="sm" />
                          <div className="flex-1">
                            <p className="font-semibold">{u.full_name}</p>
                            <p className="text-sm text-muted-foreground">@{u.username}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </TabsContent>

                  <TabsContent value="discover" className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input placeholder={t('common.search') + "..."} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground bg-muted/50 p-2 rounded-lg">
                      <span>Amigos: {friends.length.toLocaleString()} / {MAX_FRIENDS.toLocaleString()}</span>
                      {currentUserCountry && (
                        <span className="flex items-center gap-1"><Flag className="h-3 w-3" />{getCountryName(currentUserCountry)}</span>
                      )}
                    </div>

                    {currentUserCountry && filteredUsersFromCountry.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="font-semibold flex items-center gap-2 text-primary">
                          <Flag className="h-4 w-4" /> {t('friends.fromYourCountry')} ({filteredUsersFromCountry.length})
                        </h3>
                        {filteredUsersFromCountry.map((u) => (
                          <UserCard key={u.id} user={u} navigate={navigate} sendFriendRequest={sendFriendRequest} language={language} friends={friends} MAX_FRIENDS={MAX_FRIENDS} isOnline={onlineUsers.has(u.id)} />
                        ))}
                      </div>
                    )}

                    {filteredUsersFromOther.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold flex items-center gap-2 text-muted-foreground">
                            <Globe className="h-4 w-4" /> {t('friends.fromOtherCountries')} ({filteredUsersFromOther.length})
                          </h3>
                          {currentUserCountry && (
                            <Button variant="ghost" size="sm" onClick={() => setShowOtherCountries(!showOtherCountries)}>
                              {showOtherCountries ? t('common.seeLess') : t('common.seeMore')}
                            </Button>
                          )}
                        </div>
                        {(showOtherCountries || !currentUserCountry) && filteredUsersFromOther.map((u) => (
                          <UserCard key={u.id} user={u} navigate={navigate} sendFriendRequest={sendFriendRequest} language={language} friends={friends} MAX_FRIENDS={MAX_FRIENDS} showCountry getCountryName={getCountryName} isOnline={onlineUsers.has(u.id)} />
                        ))}
                      </div>
                    )}

                    {filteredUsersFromCountry.length === 0 && filteredUsersFromOther.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">Nenhum usuário encontrado</p>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
};

interface UserCardProps {
  user: User;
  navigate: (path: string) => void;
  sendFriendRequest: (userId: string) => void;
  language: string;
  friends: User[];
  MAX_FRIENDS: number;
  showCountry?: boolean;
  getCountryName?: (code: string) => string;
  isOnline?: boolean;
}

const UserCard = ({ user, navigate, sendFriendRequest, language, friends, MAX_FRIENDS, showCountry, getCountryName, isOnline }: UserCardProps) => {
  const canAddFriend = friends.length < MAX_FRIENDS;
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border">
      <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => navigate(`/profile/${user.id}`)}>
        <div className="relative">
          <UserAvatar src={user.avatar_url} fallback={user.full_name} size="sm" />
          {isOnline && <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />}
        </div>
        <div>
          <p className="font-semibold">{user.full_name}</p>
          <p className="text-sm text-muted-foreground">
            @{user.username}
            {showCountry && user.country && getCountryName && <span className="ml-2 text-xs">• {getCountryName(user.country)}</span>}
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        {user.is_friend ? (
          <Button variant="outline" size="sm" disabled><UserCheck className="h-4 w-4 mr-2" />Amigos</Button>
        ) : user.request_status === "pending" ? (
          <Button variant="outline" size="sm" disabled>Pedido enviado</Button>
        ) : user.request_status === "pending_received" ? (
          <Button variant="outline" size="sm" disabled>Responda ao pedido</Button>
        ) : (
          <Button size="sm" onClick={() => sendFriendRequest(user.id)} disabled={!canAddFriend}>
            <UserPlus className="h-4 w-4 mr-2" />Adicionar
          </Button>
        )}
      </div>
    </div>
  );
};

export default Friends;
