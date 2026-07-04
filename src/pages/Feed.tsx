import { useState, useEffect, useRef } from "react";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useUnifiedFeed } from "@/hooks/useUnifiedFeed";
import { FeedFilters } from "@/components/feed/FeedFilters";
import { FeedItemCard } from "@/components/feed/FeedItemCard";
import { Upload, Image as ImageIcon, Video, Search, Loader2, RefreshCw } from "lucide-react";
import { pageCache } from "@/lib/pageCache";

const Feed = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const {
    items, loading, loadingMore, hasMore,
    filter, setFilter, search, setSearch,
    friendSet, loadMore, refresh, patchItem,
  } = useUnifiedFeed(user?.id);

  const [newPost, setNewPost] = useState("");
  const [uploading, setUploading] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Busca com debounce
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => setSearch(searchInput), 450);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchInput, setSearch]);

  // Scroll infinito
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: '600px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

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
      pageCache.clear('feed:first-page');
      toast({
        title: "Post criado!",
        description: "Seu post foi compartilhado com sucesso",
      });
      refresh();
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

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--theme-background)' }}>
      <Header />
      <main className="flex-1 w-full max-w-2xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 md:py-8">
        {/* Composer */}
        <Card className="shadow-divine mb-4">
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

        {/* Busca */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar no feed: palavras, versículos, temas, livros da Bíblia..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10 pr-10"
          />
          <button
            onClick={refresh}
            title="Atualizar feed"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {/* Filtros */}
        <div className="mb-4">
          <FeedFilters active={filter} onChange={setFilter} />
        </div>

        {/* Timeline */}
        {loading && items.length === 0 ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="shadow-divine">
                <CardContent className="pt-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                    <div className="space-y-2 flex-1">
                      <div className="h-3 bg-muted rounded animate-pulse w-1/3" />
                      <div className="h-2 bg-muted rounded animate-pulse w-1/4" />
                    </div>
                  </div>
                  <div className="h-3 bg-muted rounded animate-pulse" />
                  <div className="h-3 bg-muted rounded animate-pulse w-4/5" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : items.length === 0 ? (
          <Card className="p-8 text-center shadow-divine">
            <p className="text-4xl mb-3">🕊️</p>
            <p className="text-muted-foreground">
              {search
                ? "Nenhum conteúdo encontrado para essa busca."
                : filter === 'friends'
                  ? "Seus amigos ainda não publicaram nada. Que tal ser o primeiro a compartilhar?"
                  : "Nenhuma publicação ainda. Seja o primeiro a compartilhar!"}
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <FeedItemCard
                key={item.key}
                item={item}
                userId={user?.id}
                isFriend={!!item.user_id && friendSet.has(item.user_id)}
                onPatch={patchItem}
              />
            ))}

            {/* Sentinela do scroll infinito */}
            <div ref={sentinelRef} className="h-4" />

            {loadingMore && (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}

            {!hasMore && items.length > 0 && (
              <p className="text-center text-sm text-muted-foreground py-6">
                ✨ Você chegou ao fim do feed
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Feed;
