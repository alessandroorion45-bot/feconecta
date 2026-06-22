import { useState, useEffect, useRef } from "react";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Music, Heart, MessageCircle, Send, Plus, ChevronLeft, Play, Pause, Mic, Upload, Trash2, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useGamification } from "@/hooks/useGamification";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface WorshipPost {
  id: string;
  user_id: string;
  title: string;
  original_artist: string | null;
  description: string | null;
  category: string;
  media_url: string | null;
  media_type: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  profiles?: { full_name: string; avatar_url: string | null; username: string };
}

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: { full_name: string; avatar_url: string | null };
}

const CATEGORIES = ["Louvor", "Adoração", "Gratidão", "Hino", "Salmo", "Espontâneo"];

const Worship = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { awardXP } = useGamification(user?.id);
  const [posts, setPosts] = useState<WorshipPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [sortBy, setSortBy] = useState<"recent" | "popular">("recent");
  const [selectedPost, setSelectedPost] = useState<WorshipPost | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form
  const [formTitle, setFormTitle] = useState("");
  const [formArtist, setFormArtist] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formCategory, setFormCategory] = useState("Louvor");
  const [mediaFile, setMediaFile] = useState<File | null>(null);

  // Audio recording
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => { loadPosts(); loadUserLikes(); }, [sortBy]);

  const loadPosts = async () => {
    setLoading(true);
    let query = supabase.from("worship_posts").select("*, profiles:user_id(full_name, avatar_url, username)");
    if (sortBy === "recent") query = query.order("created_at", { ascending: false });
    else query = query.order("likes_count", { ascending: false });
    const { data } = await query.limit(50);
    if (data) setPosts(data as unknown as WorshipPost[]);
    setLoading(false);
  };

  const loadUserLikes = async () => {
    if (!user) return;
    const { data } = await supabase.from("worship_likes").select("post_id").eq("user_id", user.id);
    if (data) setUserLikes(new Set(data.map(l => l.post_id)));
  };

  const loadComments = async (postId: string) => {
    const { data } = await supabase
      .from("worship_comments")
      .select("*, profiles:user_id(full_name, avatar_url)")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });
    if (data) setComments(data as unknown as Comment[]);
  };

  const filtered = posts.filter(p => {
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.profiles?.full_name?.toLowerCase().includes(search.toLowerCase());
    const matchCat = !filterCategory || p.category === filterCategory;
    return matchSearch && matchCat;
  });

  const toggleLike = async (postId: string) => {
    if (!user) return;
    if (userLikes.has(postId)) {
      await supabase.from("worship_likes").delete().eq("user_id", user.id).eq("post_id", postId);
      setUserLikes(prev => { const n = new Set(prev); n.delete(postId); return n; });
      setPosts(p => p.map(post => post.id === postId ? { ...post, likes_count: post.likes_count - 1 } : post));
    } else {
      await supabase.from("worship_likes").insert({ user_id: user.id, post_id: postId });
      setUserLikes(prev => new Set(prev).add(postId));
      setPosts(p => p.map(post => post.id === postId ? { ...post, likes_count: post.likes_count + 1 } : post));

      // Conceder XP por favoritar louvor
      await awardXP('worship_favorited');
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = e => chunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        stream.getTracks().forEach(t => t.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch { toast({ title: "Erro ao acessar microfone", variant: "destructive" }); }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const submitPost = async () => {
    if (!user || !formTitle.trim()) return;
    setSubmitting(true);

    let mediaUrl: string | null = null;
    let mediaType: string | null = null;
    const fileToUpload = mediaFile || (audioBlob ? new File([audioBlob], "recording.webm", { type: "audio/webm" }) : null);

    if (fileToUpload) {
      mediaType = fileToUpload.type.startsWith("video") ? "video" : "audio";
      const path = `${user.id}/${Date.now()}-${fileToUpload.name}`;
      const { error: uploadError } = await supabase.storage.from("worship-media").upload(path, fileToUpload);
      if (uploadError) { toast({ title: "Erro no upload", variant: "destructive" }); setSubmitting(false); return; }
      const { data: urlData } = supabase.storage.from("worship-media").getPublicUrl(path);
      mediaUrl = urlData.publicUrl;
    }

    const { error } = await supabase.from("worship_posts").insert({
      user_id: user.id,
      title: formTitle.trim(),
      original_artist: formArtist.trim() || null,
      description: formDesc.trim() || null,
      category: formCategory,
      media_url: mediaUrl,
      media_type: mediaType,
    });

    setSubmitting(false);
    if (error) { toast({ title: "Erro ao publicar", variant: "destructive" }); return; }
    toast({ title: "Louvor publicado! 🎵" });
    setFormTitle(""); setFormArtist(""); setFormDesc(""); setMediaFile(null); setAudioBlob(null); setShowForm(false);
    loadPosts();
  };

  const submitComment = async () => {
    if (!user || !newComment.trim() || !selectedPost) return;
    await supabase.from("worship_comments").insert({ post_id: selectedPost.id, user_id: user.id, content: newComment.trim() });
    setNewComment("");
    loadComments(selectedPost.id);
    loadPosts();
    toast({ title: "Comentário enviado! 💬" });
  };

  const deletePost = async (postId: string) => {
    await supabase.from("worship_posts").delete().eq("id", postId);
    setSelectedPost(null);
    loadPosts();
    toast({ title: "Louvor removido" });
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

  // Detail
  if (selectedPost) {
    return (
      <div className="min-h-screen bg-gradient-hero">
        <Header />
        <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <Button variant="ghost" className="mb-4" onClick={() => setSelectedPost(null)}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
          <Card className="shadow-divine mb-6">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <Avatar><AvatarImage src={selectedPost.profiles?.avatar_url || undefined} /><AvatarFallback>{selectedPost.profiles?.full_name?.[0]}</AvatarFallback></Avatar>
                  <div>
                    <CardTitle className="text-xl">{selectedPost.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{selectedPost.profiles?.full_name} • {formatDate(selectedPost.created_at)}</p>
                    {selectedPost.original_artist && <p className="text-sm text-muted-foreground">Original: {selectedPost.original_artist}</p>}
                  </div>
                </div>
                {user?.id === selectedPost.user_id && (
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deletePost(selectedPost.id)}><Trash2 className="h-4 w-4" /></Button>
                )}
              </div>
              <Badge variant="outline" className="w-fit mt-2">{selectedPost.category}</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedPost.description && <p className="text-muted-foreground">{selectedPost.description}</p>}
              {selectedPost.media_url && selectedPost.media_type === "audio" && (
                <audio controls src={selectedPost.media_url} className="w-full" />
              )}
              {selectedPost.media_url && selectedPost.media_type === "video" && (
                <video controls src={selectedPost.media_url} className="w-full rounded-lg" />
              )}
              <div className="flex gap-2">
                <Button variant={userLikes.has(selectedPost.id) ? "default" : "outline"} size="sm" onClick={() => toggleLike(selectedPost.id)}>
                  <Heart className={`h-4 w-4 mr-1 ${userLikes.has(selectedPost.id) ? "fill-current" : ""}`} /> {selectedPost.likes_count}
                </Button>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Comentários</h3>
                {comments.map(c => (
                  <div key={c.id} className="flex gap-2 mb-3">
                    <Avatar className="h-7 w-7"><AvatarFallback className="text-xs">{c.profiles?.full_name?.[0]}</AvatarFallback></Avatar>
                    <div className="bg-muted rounded-lg p-2 flex-1">
                      <p className="text-xs font-medium">{c.profiles?.full_name}</p>
                      <p className="text-sm text-muted-foreground">{c.content}</p>
                    </div>
                  </div>
                ))}
                <div className="flex gap-2 mt-3">
                  <Input placeholder="Comente..." value={newComment} onChange={e => setNewComment(e.target.value)} />
                  <Button size="icon" onClick={submitComment} disabled={!newComment.trim()}><Send className="h-4 w-4" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Header />
      <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-divine bg-clip-text text-transparent mb-2">Louvores</h1>
          <p className="text-muted-foreground">Grave e compartilhe sua adoração a Deus</p>
        </div>

        {user && (
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button className="w-full mb-6 bg-gradient-primary text-primary-foreground shadow-glow">
                <Plus className="h-4 w-4 mr-2" /> Publicar Louvor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Publicar Louvor</DialogTitle>
                <DialogDescription>Compartilhe sua adoração com a comunidade</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div><Label>Nome do Louvor *</Label><Input value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="Ex: Grande é o Senhor" /></div>
                <div><Label>Cantor/Autor Original</Label><Input value={formArtist} onChange={e => setFormArtist(e.target.value)} placeholder="Opcional" /></div>
                <div><Label>Descrição</Label><Textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} rows={2} /></div>
                <div><Label>Categoria</Label>
                  <Select value={formCategory} onValueChange={setFormCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>

                <div className="border rounded-lg p-4 space-y-3">
                  <Label>Mídia (Áudio ou Vídeo)</Label>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={isRecording ? stopRecording : startRecording}>
                      <Mic className={`h-4 w-4 mr-1 ${isRecording ? "text-red-500 animate-pulse" : ""}`} />
                      {isRecording ? "Parar Gravação" : "Gravar Áudio"}
                    </Button>
                    <label className="cursor-pointer">
                      <Button type="button" variant="outline" size="sm" asChild>
                        <span><Upload className="h-4 w-4 mr-1" /> Upload</span>
                      </Button>
                      <input type="file" accept="audio/*,video/*" className="hidden" onChange={e => { setMediaFile(e.target.files?.[0] || null); setAudioBlob(null); }} />
                    </label>
                  </div>
                  {audioBlob && <p className="text-sm text-green-600">✅ Áudio gravado com sucesso</p>}
                  {mediaFile && <p className="text-sm text-green-600">✅ {mediaFile.name}</p>}
                </div>

                <Button onClick={submitPost} disabled={!formTitle.trim() || submitting} className="w-full">
                  {submitting ? "Publicando..." : "Publicar Louvor"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Filters */}
        <div className="space-y-3 mb-6">
          <div className="relative">
            <Music className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar louvor..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant={sortBy === "recent" ? "default" : "outline"} size="sm" onClick={() => setSortBy("recent")}>Recentes</Button>
            <Button variant={sortBy === "popular" ? "default" : "outline"} size="sm" onClick={() => setSortBy("popular")}>Mais curtidos</Button>
            {CATEGORIES.map(c => (
              <Button key={c} variant={filterCategory === c ? "default" : "outline"} size="sm" onClick={() => setFilterCategory(filterCategory === c ? "" : c)}>{c}</Button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Music className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-lg font-medium text-muted-foreground">Nenhum louvor publicado ainda</p>
            <p className="text-sm text-muted-foreground mt-1">Seja o primeiro a compartilhar sua adoração!</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filtered.map(post => (
              <Card key={post.id} className="cursor-pointer hover:shadow-divine transition-shadow" onClick={() => { setSelectedPost(post); loadComments(post.id); }}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center shrink-0">
                      <Music className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold">{post.title}</p>
                      <p className="text-sm text-muted-foreground">{post.profiles?.full_name} • {formatDate(post.created_at)}</p>
                      {post.original_artist && <p className="text-xs text-muted-foreground">Original: {post.original_artist}</p>}
                      <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {post.likes_count}</span>
                        <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" /> {post.comments_count}</span>
                        <Badge variant="outline" className="text-xs">{post.category}</Badge>
                        {post.media_type && <Badge variant="secondary" className="text-xs">{post.media_type === "audio" ? "🎙️ Áudio" : "🎬 Vídeo"}</Badge>}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Worship;
