import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Smile } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGamification } from "@/hooks/useGamification";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

type GratitudePost = {
  id: string;
  author_name: string;
  message: string;
  created_at: string;
  amens_count: number;
  type: "gratidao" | "testemunho";
  user_id: string;
};

const GratitudeWall = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { awardXP } = useGamification(user?.id);
  const [posts, setPosts] = useState<GratitudePost[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [amenList, setAmenList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar posts
  useEffect(() => {
    loadPosts();
    if (user) {
      loadUserAmens();
    }
  }, [user]);

  const loadPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('gratitude_posts_with_user')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Erro ao carregar posts:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os posts.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUserAmens = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('gratitude_amens')
        .select('post_id')
        .eq('user_id', user.id);

      if (error) throw error;
      setAmenList((data || []).map(a => a.post_id));
    } catch (error) {
      console.error('Erro ao carregar amens:', error);
    }
  };

  const submitPost = async () => {
    if (!newMessage.trim()) {
      toast({
        title: "Mensagem vazia",
        description: "Por favor, escreva sua gratidão ou testemunho.",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Login necessário",
        description: "Faça login para publicar.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('gratitude_posts')
        .insert({
          user_id: user.id,
          message: newMessage,
          type: 'gratidao'
        })
        .select()
        .single();

      if (error) throw error;

      // Adicionar à lista local
      await loadPosts();
      setNewMessage("");

      // Conceder XP por publicar gratidão
      await awardXP('gratitude_post');

      toast({
        title: "Gratidão publicada! 🙌",
        description: "+15 XP! Que Deus continue te abençoando."
      });
    } catch (error) {
      console.error('Erro ao publicar:', error);
      toast({
        title: "Erro",
        description: "Não foi possível publicar sua gratidão.",
        variant: "destructive"
      });
    }
  };

  const toggleAmen = async (postId: string) => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Faça login para dar amém.",
        variant: "destructive"
      });
      return;
    }

    const hasAmen = amenList.includes(postId);

    try {
      if (hasAmen) {
        // Remover amem
        const { error } = await supabase
          .from('gratitude_amens')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (error) throw error;
        setAmenList(amenList.filter(id => id !== postId));
      } else {
        // Adicionar amem
        const { error } = await supabase
          .from('gratitude_amens')
          .insert({
            post_id: postId,
            user_id: user.id
          });

        if (error) throw error;
        setAmenList([...amenList, postId]);
      }

      // Atualizar contagem local
      setPosts(posts.map(p =>
        p.id === postId
          ? { ...p, amens_count: p.amens_count + (hasAmen ? -1 : 1) }
          : p
      ));
    } catch (error) {
      console.error('Erro ao dar amém:', error);
      toast({
        title: "Erro",
        description: "Não foi possível processar sua ação.",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Agora";
    if (diffMins < 60) return `${diffMins} min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero">
        <Header />
        <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <div className="text-center">
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Header />
      <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-divine bg-clip-text text-transparent mb-2">
            Mural de Gratidão
          </h1>
          <p className="text-muted-foreground">Compartilhe gratidão e veja como Deus age</p>
        </div>

        {user && (
          <Card className="mb-8 shadow-divine">
            <CardContent className="p-4">
              <Textarea
                placeholder="Compartilhe sua gratidão ou testemunho..."
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                className="mb-3"
                rows={3}
              />
              <Button
                onClick={submitPost}
                disabled={!newMessage.trim()}
                className="w-full sm:w-auto"
              >
                <Send className="h-4 w-4 mr-2" /> Publicar Gratidão
              </Button>
            </CardContent>
          </Card>
        )}

        {!user && (
          <Card className="mb-8 shadow-divine">
            <CardContent className="p-4 text-center">
              <p className="text-muted-foreground">Faça login para compartilhar sua gratidão</p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4">
          {posts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">
                  Nenhuma gratidão publicada ainda. Seja o primeiro!
                </p>
              </CardContent>
            </Card>
          ) : (
            posts.map(post => (
              <Card key={post.id} className="hover:shadow-divine transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
                        {post.author_name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{post.author_name || 'Anônimo'}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(post.created_at)}</p>
                      </div>
                    </div>
                    {post.type === "testemunho" && (
                      <span className="text-xs bg-accent/20 text-accent-foreground px-2 py-0.5 rounded-full">
                        ✨ Testemunho
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground leading-relaxed mb-3">{post.message}</p>
                  <Button
                    variant={amenList.includes(post.id) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleAmen(post.id)}
                  >
                    <Smile className="h-4 w-4 mr-1" /> Amém ({post.amens_count})
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default GratitudeWall;
