import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import UserAvatar from "@/components/UserAvatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Heart, MessageCircle, Upload, Image as ImageIcon, Video } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import ImageLightbox from "@/components/ImageLightbox";

interface Post {
  id: string;
  user_id: string;
  content: string;
  media_url: string | null;
  media_type: "image" | "video" | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  liked_by_me?: boolean;
  profiles: {
    username: string;
    full_name: string;
    avatar_url: string;
  };
}

const Feed = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState("");
  const [uploading, setUploading] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentUserId = user?.id || "";

  const loadFeed = useCallback(async () => {
    if (!user) return;
    
    const { data: postsData } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (postsData) {
      const userIds = [...new Set(postsData.map(p => p.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .in("id", userIds);

      // Check which posts the current user liked
      const postIds = postsData.map(p => p.id);
      const { data: myLikes } = await supabase
        .from("post_likes")
        .select("post_id")
        .eq("user_id", user.id)
        .in("post_id", postIds);

      const likedSet = new Set(myLikes?.map(l => l.post_id) || []);
      const profileMap = new Map(profiles?.map(p => [p.id, p]));
      
      const postsWithProfiles = postsData.map(p => ({
        ...p,
        liked_by_me: likedSet.has(p.id),
        profiles: profileMap.get(p.user_id) || { username: "?", full_name: "?", avatar_url: "" }
      }));

      setPosts(postsWithProfiles as Post[]);
    }
  }, [user]);

  useEffect(() => {
    if (user) loadFeed();

    const channel = supabase
      .channel('feed-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
        // Debounce realtime reloads to prevent flooding
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => loadFeed(), 1000);
      })
      .subscribe();

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      supabase.removeChannel(channel);
    };
  }, [user, loadFeed]);

  const handleMediaSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setMediaFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setMediaPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const clearMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
  };

  const createPost = async () => {
    if (!newPost.trim() && !mediaFile) return;

    try {
      setUploading(true);
      let mediaUrl = null;
      let mediaType = null;

      if (mediaFile) {
        const fileExt = mediaFile.name.split(".").pop();
        const filePath = `${user?.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("posts")
          .upload(filePath, mediaFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("posts")
          .getPublicUrl(filePath);

        mediaUrl = publicUrl;
        mediaType = mediaFile.type.startsWith("video/") ? "video" : "image";
      }

      const { error } = await supabase.from("posts").insert({
        user_id: user?.id,
        content: newPost,
        media_url: mediaUrl,
        media_type: mediaType,
      });

      if (error) throw error;

      setNewPost("");
      clearMedia();
      toast({
        title: "Post criado!",
        description: "Seu post foi compartilhado com sucesso",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const toggleLike = async (postId: string) => {
    // Optimistic UI update
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      const wasLiked = p.liked_by_me;
      return {
        ...p,
        liked_by_me: !wasLiked,
        likes_count: wasLiked ? p.likes_count - 1 : p.likes_count + 1,
      };
    }));

    const { data: existing } = await supabase
      .from("post_likes")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", currentUserId)
      .maybeSingle();

    if (existing) {
      await supabase.from("post_likes").delete().eq("id", existing.id);
    } else {
      await supabase.from("post_likes").insert({
        post_id: postId,
        user_id: currentUserId,
      });
    }
    // No full reload - optimistic update already done
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--theme-background)' }}>
      <Header />
      <main className="flex-1 w-full max-w-2xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 md:py-8">
        <Card className="shadow-divine mb-6">
          <CardHeader>
            <CardTitle>Compartilhar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="No que você está pensando?"
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              rows={3}
            />
            {mediaPreview && (
              <div className="relative rounded-lg overflow-hidden border">
                {mediaFile?.type.startsWith("video/") ? (
                  <video src={mediaPreview} controls className="w-full max-h-64 object-contain bg-black" />
                ) : (
                  <img 
                    src={mediaPreview} 
                    alt="Preview" 
                    className="w-full max-h-64 object-contain bg-muted" 
                  />
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={clearMedia}
                >
                  Remover
                </Button>
              </div>
            )}
            <div className="flex gap-2">
              <label htmlFor="media-upload">
                <Button variant="outline" size="sm" asChild>
                  <span className="cursor-pointer">
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Foto
                  </span>
                </Button>
              </label>
              <label htmlFor="video-upload">
                <Button variant="outline" size="sm" asChild>
                  <span className="cursor-pointer">
                    <Video className="h-4 w-4 mr-2" />
                    Vídeo
                  </span>
                </Button>
              </label>
              <input
                id="media-upload"
                type="file"
                accept="image/*"
                onChange={handleMediaSelect}
                className="hidden"
              />
              <input
                id="video-upload"
                type="file"
                accept="video/*"
                onChange={handleMediaSelect}
                className="hidden"
              />
              <Button
                onClick={createPost}
                disabled={uploading || (!newPost.trim() && !mediaFile)}
                className="ml-auto"
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? "Publicando..." : "Publicar"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {posts.map((post) => (
            <Card key={post.id} className="shadow-divine overflow-hidden">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3 mb-4">
                  <UserAvatar 
                    src={post.profiles.avatar_url}
                    fallback={post.profiles.full_name || "?"}
                    size="md"
                    onClick={() => navigate(`/profile/${post.user_id}`)}
                  />
                  <div>
                    <p 
                      className="font-semibold cursor-pointer hover:underline"
                      onClick={() => navigate(`/profile/${post.user_id}`)}
                    >
                      {post.profiles.full_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      @{post.profiles.username} •{" "}
                      {formatDistanceToNow(new Date(post.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                </div>

                {post.content && <p className="mb-4 whitespace-pre-wrap">{post.content}</p>}

                {post.media_url && (
                  <div className="mb-4 rounded-lg overflow-hidden bg-muted -mx-6">
                    {post.media_type === "video" ? (
                      <video 
                        src={post.media_url} 
                        controls 
                        className="w-full max-h-[500px] object-contain" 
                      />
                    ) : (
                      <ImageLightbox 
                        src={post.media_url} 
                        alt="Post image"
                        className="w-full max-h-[500px] object-contain"
                      />
                    )}
                  </div>
                )}

                <div className="flex gap-4 text-muted-foreground">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleLike(post.id)}
                    className={post.liked_by_me ? "text-red-500" : ""}
                  >
                    <Heart className={`h-4 w-4 mr-2 ${post.liked_by_me ? "fill-current" : ""}`} />
                    {post.likes_count}
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    {post.comments_count}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Feed;
