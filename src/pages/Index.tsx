import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, animate } from "framer-motion";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LoadingFallback from "@/components/LoadingFallback";
import { Book, Heart, Church, Sparkles, User, Gamepad2, MessageSquare, BookOpen, HelpCircle, Search, Star, Users, Brain, BookMarked } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { fetchLandingStats, LandingStats } from "@/lib/landingStats";
import SEO from "@/components/SEO";

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
  { icon: Star, title: "Meus Favoritos", description: "Versículos, estudos e louvores salvos em um só lugar", link: "/favorites", gradient: "from-accent to-primary-glow" },
  { icon: Users, title: "Amigos", description: "Conecte-se com irmãos e fortaleça sua comunidade", link: "/friends", gradient: "from-secondary to-accent" },
];

const STAT_ROWS: { key: keyof LandingStats; icon: string; label: string }[] = [
  { key: "versiculos", icon: "📖", label: "Versículos disponíveis" },
  { key: "oracoes", icon: "🙏", label: "Orações compartilhadas" },
  { key: "testemunhos", icon: "❤️", label: "Testemunhos publicados" },
  { key: "membros", icon: "👥", label: "Membros da comunidade" },
];

/** Conta de 0 até o valor real quando a faixa entra na viewport — nunca fabricado, vem de get_landing_stats(). */
const AnimatedStat = ({ value, reduced }: { value: number; reduced: boolean }) => {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    if (reduced) {
      setDisplay(value);
      return;
    }
    if (started.current || !value || !ref.current) return;
    const el = ref.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          animate(0, value, {
            duration: 1.6,
            ease: [0.16, 1, 0.3, 1],
            onUpdate: (v) => setDisplay(Math.round(v)),
          });
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value, reduced]);

  return <span ref={ref}>{display.toLocaleString("pt-BR")}</span>;
};

const Index = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [userName, setUserName] = useState<string>("");
  const [stats, setStats] = useState<LandingStats | null>(null);
  const reduced = !!useReducedMotion();

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

  useEffect(() => {
    fetchLandingStats().then(setStats);
  }, []);

  if (authLoading) {
    return <LoadingFallback />;
  }

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col">
      <SEO
        path="/"
        title="Início"
        description="Aliança Kingdom é uma plataforma cristã completa para igrejas, líderes, células, comunidades, estudos bíblicos, pedidos de oração, eventos, discipulado, evangelismo e comunhão."
        keywords="plataforma cristã, rede social cristã, comunidade cristã, igreja online, bíblia online, pedido de oração, igreja em células"
      />
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 md:py-24 text-center">
        {/* manchas suaves de cor ao fundo, na paleta do próprio tema */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-secondary/10 blur-3xl" />
          <div className="absolute top-1/3 -right-24 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />
          <div className="absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl">
          {/* Logo Aliança MAGNÉTICO */}
          <motion.div
            className="mb-10 relative inline-block"
            initial={reduced ? false : { opacity: 0, scale: 0.85, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Glow effects pulsantes */}
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/30 via-amber-500/30 to-orange-500/30 rounded-full blur-3xl animate-pulse" />
            <div className="absolute inset-0 bg-gradient-to-r from-amber-400/20 to-yellow-400/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: "1s" }} />

            {/* partículas douradas flutuando ao redor da logo */}
            {!reduced && (
              <div className="absolute inset-0 pointer-events-none" aria-hidden>
                {[...Array(7)].map((_, i) => {
                  const angle = (i / 7) * Math.PI * 2;
                  const radius = 46 + (i % 3) * 8;
                  return (
                    <motion.span
                      key={i}
                      className="absolute h-1 w-1 rounded-full"
                      style={{
                        left: `${50 + Math.cos(angle) * radius}%`,
                        top: `${50 + Math.sin(angle) * radius}%`,
                        background: "#fbbf24",
                        boxShadow: "0 0 6px rgba(251,191,36,0.9)",
                      }}
                      animate={{ opacity: [0.2, 1, 0.2], scale: [0.7, 1.3, 0.7] }}
                      transition={{ duration: 2.6 + (i % 3) * 0.4, repeat: Infinity, delay: i * 0.3, ease: "easeInOut" }}
                    />
                  );
                })}
              </div>
            )}

            {/* Logo da Arca */}
            <div className="relative">
              <img
                src="/alianca-logo.png"
                alt="Aliança Kingdom"
                className="h-32 w-32 sm:h-40 sm:w-40 md:h-48 md:w-48 lg:h-56 lg:w-56 object-contain drop-shadow-2xl filter brightness-110 mix-blend-multiply animate-float"
                style={{ animation: "float 3s ease-in-out infinite" }}
              />
              {/* reflexo dourado passando lentamente, recortado no formato exato da logo */}
              {!reduced && (
                <motion.div
                  aria-hidden
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    WebkitMaskImage: "url(/alianca-logo.png)",
                    WebkitMaskSize: "contain",
                    WebkitMaskRepeat: "no-repeat",
                    WebkitMaskPosition: "center",
                    maskImage: "url(/alianca-logo.png)",
                    maskSize: "contain",
                    maskRepeat: "no-repeat",
                    maskPosition: "center",
                    background: "linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.85) 48%, rgba(253,230,138,0.9) 52%, transparent 70%)",
                    backgroundSize: "260% 260%",
                  }}
                  animate={{ backgroundPosition: ["0% 50%", "100% 50%"] }}
                  transition={{ duration: 3.2, repeat: Infinity, repeatDelay: 3.5, ease: "easeInOut" }}
                />
              )}
            </div>
          </motion.div>

          <motion.h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-5 sm:mb-7 bg-gradient-to-r from-amber-600 via-yellow-600 to-orange-600 bg-clip-text text-transparent leading-tight pt-1 pb-1 drop-shadow-lg"
            initial={reduced ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            Aliança Kingdom
          </motion.h1>
          <motion.p
            className="text-lg sm:text-xl md:text-2xl text-amber-900 dark:text-amber-100 font-medium mb-3 px-2 leading-relaxed"
            initial={reduced ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.28 }}
          >
            O Aliança Kingdom é uma comunidade cristã online e gratuita para ler a Bíblia,
            compartilhar testemunhos, orar em comunidade e crescer na fé
          </motion.p>
          <motion.p
            className="text-base sm:text-lg text-muted-foreground mb-8 sm:mb-10 px-2 leading-relaxed"
            initial={reduced ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            ✨ Crie sua conta e junte-se a milhares de irmãos conectados em Cristo
          </motion.p>

          <motion.div
            initial={reduced ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.52 }}
          >
            {user ? (
              <div className="flex flex-col items-center gap-4 sm:gap-6">
                <div className="text-xl sm:text-2xl md:text-3xl font-semibold text-foreground">
                  Bem-vindo de volta{userName ? `, ${userName.split(" ")[0]}` : ""}! 🙏
                </div>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto items-center justify-center">
                  <Link to="/feed" className="w-full sm:w-auto">
                    <Button
                      size="lg"
                      className="w-full sm:w-auto bg-gradient-primary text-primary-foreground shadow-glow text-base sm:text-lg px-8 sm:px-10 h-14 transition-all duration-250 hover:scale-[1.03] hover:shadow-2xl"
                    >
                      <User className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                      Ir para o Feed
                    </Button>
                  </Link>
                  <Link to="/bible" onClick={(e) => e.stopPropagation()} className="w-full sm:w-auto">
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full sm:w-auto text-base sm:text-lg px-8 sm:px-10 h-14 transition-all duration-250 hover:scale-[1.03]"
                      type="button"
                    >
                      <Book className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                      Ler a Bíblia
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto items-center justify-center">
                <Link to="/auth" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-gradient-primary text-primary-foreground shadow-glow text-base sm:text-lg px-8 sm:px-10 h-14 transition-all duration-250 hover:scale-[1.03] hover:shadow-2xl"
                  >
                    Entrar na Comunidade
                  </Button>
                </Link>
                <Link to="/bible" onClick={(e) => e.stopPropagation()} className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto text-base sm:text-lg px-8 sm:px-10 h-14 transition-all duration-250 hover:scale-[1.03]"
                    type="button"
                  >
                    <Book className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    Ler a Bíblia
                  </Button>
                </Link>
              </div>
            )}
          </motion.div>

          {/* Faixa de estatísticas reais da comunidade */}
          {stats && (
            <motion.div
              className="mt-12 sm:mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 max-w-3xl mx-auto"
              initial={reduced ? false : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.6 }}
            >
              {STAT_ROWS.map((row) => (
                <div key={row.key} className="flex flex-col items-center gap-1 px-2 py-3 rounded-xl border border-secondary/20 bg-background/40 backdrop-blur-sm">
                  <span className="text-xl sm:text-2xl">{row.icon}</span>
                  <span className="text-xl sm:text-2xl font-extrabold bg-gradient-to-r from-amber-600 via-yellow-600 to-orange-600 bg-clip-text text-transparent">
                    <AnimatedStat value={stats[row.key]} reduced={reduced} />
                  </span>
                  <span className="text-[11px] sm:text-xs text-muted-foreground text-center leading-tight">{row.label}</span>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* Divisor sutil com brilho dourado */}
      <div className="relative w-full max-w-3xl mx-auto h-px my-2">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-secondary/40 to-transparent" />
      </div>

      {/* Features Section */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">O que você encontra aqui</h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Recursos para fortalecer sua fé e conectar-se com irmãos
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-7 max-w-6xl mx-auto">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={reduced ? false : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: reduced ? 0 : (idx % 3) * 0.08 }}
                whileHover={reduced ? undefined : { y: -8 }}
                className="h-full rounded-lg"
                style={{ willChange: "transform" }}
              >
                <Link to={feature.link} className="block h-full">
                  <Card
                    className="h-full cursor-pointer group relative overflow-hidden border-black/5 dark:border-white/10 transition-shadow duration-300"
                    style={{ boxShadow: "0 6px 20px -8px rgba(15,23,42,0.12)" }}
                  >
                    {/* sheen sutil de vidro */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/50 dark:from-white/[0.04] via-transparent to-transparent pointer-events-none" />
                    {/* linha dourada que atravessa no hover */}
                    <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-secondary to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />

                    <CardHeader className="p-4 sm:p-6 relative">
                      <div
                        className={`relative w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-3 sm:mb-4 shadow-md group-hover:scale-110 transition-transform overflow-hidden`}
                      >
                        <div className="absolute -top-2 -left-2 h-6 w-6 rounded-full bg-white/40 blur-md pointer-events-none" aria-hidden />
                        <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white relative" />
                      </div>
                      <CardTitle className="text-xl sm:text-2xl">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 relative">
                      <p className="text-sm sm:text-base text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Versículo do Dia */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
        >
          <Card
            className="max-w-3xl mx-auto bg-gradient-primary text-primary-foreground relative overflow-hidden"
            style={{ boxShadow: "0 20px 50px -16px rgba(15,23,42,0.35)" }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-transparent pointer-events-none" />
            <CardHeader className="p-4 sm:p-6 relative">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
                Versículo do Dia
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 relative">
              <p className="text-base sm:text-lg italic mb-2 sm:mb-3">
                "O Senhor é o meu pastor; de nada terei falta. Em verdes pastagens me faz repousar e me conduz a águas tranquilas."
              </p>
              <p className="text-xs sm:text-sm opacity-90">Salmos 23:1-2</p>
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-secondary/20 py-10 sm:py-12 mt-auto overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-secondary/50 to-transparent" />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(circle at 50% 0%, rgba(251,191,36,0.06), transparent 60%)" }}
          aria-hidden
        />
        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <img src="/alianca-logo.png" alt="Aliança Kingdom" className="h-12 w-12 mx-auto mb-3 object-contain opacity-90" />
          <p className="text-xs sm:text-sm italic text-muted-foreground/80 mb-4 max-w-md mx-auto">
            "Porque dele, por meio dele e para ele são todas as coisas." — Romanos 11:36
          </p>
          <p className="text-sm sm:text-base text-muted-foreground">© 2026 Aliança Kingdom. Compartilhando fé e amor em Cristo.</p>
          <p className="text-xs sm:text-sm mt-2">
            <Link to="/privacidade" className="hover:text-foreground hover:underline transition-colors">Política de Privacidade</Link>
            <span className="mx-2">·</span>
            <Link to="/termos" className="hover:text-foreground hover:underline transition-colors">Termos de Serviço</Link>
            <span className="mx-2">·</span>
            <Link to="/sobre-o-projeto" className="hover:text-foreground hover:underline transition-colors">Sobre o Projeto</Link>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
