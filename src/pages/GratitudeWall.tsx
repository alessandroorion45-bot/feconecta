import { useState } from "react";
import Header from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Heart, Send, Smile } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type GratitudePost = { id: number; author: string; message: string; date: string; amens: number; type: "gratidão" | "testemunho" };

const mockPosts: GratitudePost[] = [
  { id: 1, author: "Maria Fernanda", message: "Deus curou meu filho que estava internado. Glória a Deus! 🙏", date: "16 Mar 2026", amens: 24, type: "testemunho" },
  { id: 2, author: "João Paulo", message: "Agradeço a Deus pela aprovação no concurso. Ele é fiel!", date: "15 Mar 2026", amens: 18, type: "gratidão" },
  { id: 3, author: "Ana Beatriz", message: "Depois de 5 anos de oração, meu marido aceitou Jesus! Aleluia! 🎉", date: "15 Mar 2026", amens: 45, type: "testemunho" },
  { id: 4, author: "Pedro Henrique", message: "Gratidão por mais um dia de vida e saúde. Cada dia é uma bênção!", date: "14 Mar 2026", amens: 12, type: "gratidão" },
  { id: 5, author: "Rebeca Santos", message: "Deus restaurou meu casamento. O que era impossível para os homens, Deus fez! ❤️", date: "14 Mar 2026", amens: 38, type: "testemunho" },
  { id: 6, author: "Lucas Gabriel", message: "Agradeço pela comunidade de irmãos que Deus colocou na minha vida.", date: "13 Mar 2026", amens: 9, type: "gratidão" },
];

const GratitudeWall = () => {
  const { toast } = useToast();
  const [posts, setPosts] = useState(mockPosts);
  const [newMessage, setNewMessage] = useState("");
  const [amenList, setAmenList] = useState<number[]>([]);

  const submitPost = () => {
    if (!newMessage.trim()) return;
    const post: GratitudePost = { id: Date.now(), author: "Você", message: newMessage, date: "Agora", amens: 0, type: "gratidão" };
    setPosts([post, ...posts]);
    setNewMessage("");
    toast({ title: "Gratidão publicada! 🙌", description: "Que Deus continue te abençoando." });
  };

  const toggleAmen = (id: number) => {
    if (amenList.includes(id)) {
      setAmenList(amenList.filter(a => a !== id));
      setPosts(posts.map(p => p.id === id ? { ...p, amens: p.amens - 1 } : p));
    } else {
      setAmenList([...amenList, id]);
      setPosts(posts.map(p => p.id === id ? { ...p, amens: p.amens + 1 } : p));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Header />
      <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-divine bg-clip-text text-transparent mb-2">Mural de Gratidão</h1>
          <p className="text-muted-foreground">Compartilhe gratidão e veja como Deus age</p>
        </div>

        <Card className="mb-8 shadow-divine">
          <CardContent className="p-4">
            <Textarea placeholder="Compartilhe sua gratidão ou testemunho..." value={newMessage} onChange={e => setNewMessage(e.target.value)} className="mb-3" rows={3} />
            <Button onClick={submitPost} disabled={!newMessage.trim()} className="w-full sm:w-auto">
              <Send className="h-4 w-4 mr-2" /> Publicar Gratidão
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          {posts.map(post => (
            <Card key={post.id} className="hover:shadow-divine transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
                      {post.author[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{post.author}</p>
                      <p className="text-xs text-muted-foreground">{post.date}</p>
                    </div>
                  </div>
                  {post.type === "testemunho" && (
                    <span className="text-xs bg-accent/20 text-accent-foreground px-2 py-0.5 rounded-full">✨ Testemunho</span>
                  )}
                </div>
                <p className="text-muted-foreground leading-relaxed mb-3">{post.message}</p>
                <Button variant={amenList.includes(post.id) ? "default" : "outline"} size="sm" onClick={() => toggleAmen(post.id)}>
                  <Smile className="h-4 w-4 mr-1" /> Amém ({post.amens})
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default GratitudeWall;
