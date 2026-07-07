import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LoadingFallback from "@/components/LoadingFallback";
import { Book, Heart, Church, Sparkles, User, Gamepad2, MessageSquare, BookOpen, HelpCircle, Search, Star, Users, Brain, BookMarked } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    if (!authLoading && user) {
      navigate("/feed");
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) {
      setUserName("");
      return;
    }
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setUserName(data?.full_name || "");
      });
  }, [user]);

  const features = [
    { icon: Book, title: "Bíblia Sagrada", description: "Leia e medite na Palavra de Deus com uma interface moderna", link: "/bible", gradient: "from-primary to-primary-glow" },
    { icon: Heart, title: "Depoimentos", description: "Compartilhe testemunhos e veja como Deus age na vida dos irmãos", link: "/testimonies", gradient: "from-accent to-accent/70" },
    { icon: Church, title: "Orações", description: "Publique pedidos de oração e interceda pelos irmãos", link: "/prayers", gradient: "from-secondary to-secondary-glow" },
    { icon: Gamepad2, title: "Palavra Viva", description: "Caça-palavras bíblico interativo para aprender brincando", link: "/palavra-viva", gradient: "from-secondary to-primary" },
    { icon: BookOpen, title: "Plano de Leitura", description: "Planos de 30, 90 dias ou anual com progresso e lembretes", link: "/bible", gradient: "from-primary to-secondary" },
    { icon: MessageSquare, title: "Chat da Comunidade", description: "Converse com irmãos em chats privados e grupos temáticos", link: "/chat", gradient: "from-accent to-primary" },
    { icon: Sparkles, title: "Devocional Diário", description: "Versículo, reflexão e oração para cada dia", link: "/devotional", gradient: "from-primary-glow to-accent" },
    { icon: BookMarked, title: "Estudos Bíblicos", description: "Pregações em vídeo, áudio e texto para crescimento espiritual", link: "/studies", gradient: "from-secondary to-accent" },
    { icon: Brain, title: "Quiz Bíblico", description: "Teste seus conhecimentos com perguntas interativas", link: "/quiz", gradient: "from-accent to-secondary" },
    { icon: HelpCircle, title: "Perguntas Bíblicas", description: "Tire dúvidas e aprenda com a comunidade", link: "/questions", gradient: "from-secondary to-primary" },
    { icon: Search, title: "Dicionário Bíblico", description: "Explore termos, personagens e lugares da Bíblia", link: "/dictionary", gradient: "from-secondary to-primary-glow" },
    { icon: Users, title: "Acompanhamento Espiritual", description: "Discipulado, metas espirituais e mentoria", link: "/mentoring", gradient: "from-primary to-accent" },
    { icon: Star, title: "Meus Favoritos", description: "Versículos, estudos e louvores salvos em um só lugar", link: "/favorites", gradient: "from-accent to-primary-glow" },
    { icon: Users, title: "Amigos", description: "Conecte-se com irmãos e fortaleça sua comunidade", link: "/friends", gradient: "from-secondary to-accent" },
  ];

  if (authLoading) {
    return <LoadingFallback />;
  }

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col">
      <Header />
      
      {/* Hero Section */}
      <section className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 md:py-20 text-center">
        <div className="mx-auto max-w-4xl">
          {/* Logo Aliança MAGNÉTICO */}
          <div className="mb-8 relative inline-block">
            {/* Glow effects pulsantes */}
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/30 via-amber-500/30 to-orange-500/30 rounded-full blur-3xl animate-pulse" />
            <div className="absolute inset-0 bg-gradient-to-r from-amber-400/20 to-yellow-400/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />

            {/* Logo da Arca */}
            <div className="relative">
              <img
                src="/alianca-logo.png"
                alt="Aliança"
                className="h-32 w-32 sm:h-40 sm:w-40 md:h-48 md:w-48 lg:h-56 lg:w-56 object-contain drop-shadow-2xl filter brightness-110 mix-blend-multiply animate-float"
                style={{
                  animation: 'float 3s ease-in-out infinite'
                }}
              />
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-4 sm:mb-6 bg-gradient-to-r from-amber-600 via-yellow-600 to-orange-600 bg-clip-text text-transparent leading-tight pt-1 pb-1 drop-shadow-lg">
            Aliança
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-amber-900 dark:text-amber-100 font-medium mb-3 px-2 leading-relaxed">
            Uma comunidade cristã moderna para compartilhar fé, testemunhos e comunhão
          </p>
          <p className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8 px-2 leading-relaxed">
            ✨ Junte-se a milhares de irmãos conectados em Cristo
          </p>
          {user ? (
            <div className="flex flex-col items-center gap-4 sm:gap-6">
              <div className="text-xl sm:text-2xl md:text-3xl font-semibold text-foreground">
                Bem-vindo de volta{userName ? `, ${userName.split(" ")[0]}` : ""}! 🙏
              </div>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto items-center justify-center">
                <Link to="/feed" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto bg-gradient-primary text-primary-foreground shadow-glow text-base sm:text-lg px-6 sm:px-8">
                    <User className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    Ir para o Feed
                  </Button>
                </Link>
                <Link to="/bible" onClick={(e) => e.stopPropagation()} className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8" type="button">
                    <Book className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    Ler a Bíblia
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto items-center justify-center">
              <Link to="/auth" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto bg-gradient-primary text-primary-foreground shadow-glow text-base sm:text-lg px-6 sm:px-8">
                  Entrar na Comunidade
                </Button>
              </Link>
              <Link to="/bible" onClick={(e) => e.stopPropagation()} className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8" type="button">
                  <Book className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  Ler a Bíblia
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">O que você encontra aqui</h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Recursos para fortalecer sua fé e conectar-se com irmãos
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Link key={feature.title} to={feature.link}>
                <Card className="h-full hover:shadow-divine transition-shadow cursor-pointer group">
                  <CardHeader className="p-4 sm:p-6">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <CardTitle className="text-xl sm:text-2xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                    <p className="text-sm sm:text-base text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Versículo do Dia */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <Card className="max-w-3xl mx-auto bg-gradient-primary text-primary-foreground shadow-divine">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
              Versículo do Dia
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            <p className="text-base sm:text-lg italic mb-2 sm:mb-3">
              "O Senhor é o meu pastor; de nada terei falta. Em verdes pastagens me faz repousar e me conduz a águas tranquilas."
            </p>
            <p className="text-xs sm:text-sm opacity-90">Salmos 23:1-2</p>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t py-6 sm:py-8 mt-auto">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm sm:text-base text-muted-foreground">
          <p>© 2024 Aliança. Compartilhando fé e amor em Cristo.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
