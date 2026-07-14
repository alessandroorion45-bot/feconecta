import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { Book, Heart, Church, User as UserIcon, LogOut, Trophy, Target, TrendingUp, Share2, Users, Brain, Menu, Video, BookOpen, MessageSquare, Sparkles, HelpCircle, Search as SearchIcon, Star, BookMarked, HandHeart, Crown } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import NotificationPanel from "@/components/NotificationPanel";
import PushNotificationToggle from "@/components/PushNotificationToggle";

interface MenuItemProps {
  path: string;
  icon: React.ReactNode;
  label: string;
  currentPath: string;
  onClick: (path: string) => void;
  iconColor?: string;
}

const MenuItem = ({ path, icon, label, currentPath, onClick, iconColor }: MenuItemProps) => {
  const isActive = currentPath === path;
  return (
    <Button
      variant="ghost"
      className={`justify-start gap-3 h-11 text-base w-full transition-all duration-250 ease-out ${
        isActive
          ? "bg-primary/10 text-primary font-semibold border-l-3 border-primary rounded-l-none shadow-sm"
          : "hover:bg-muted/80 hover:translate-x-1 hover:shadow-sm"
      }`}
      onClick={() => onClick(path)}
      aria-label={`Ir para ${label}`}
    >
      <span className={`shrink-0 transition-transform duration-250 ${isActive ? "text-primary scale-110" : iconColor || ""} ${!isActive && "group-hover:scale-105"}`}>{icon}</span>
      <span className="leading-normal">{label}</span>
    </Button>
  );
};

const MenuSection = ({ title }: { title: string }) => (
  <>
    <div className="h-px bg-border my-2" />
    <p className="text-xs text-muted-foreground uppercase tracking-wider px-3 py-1.5 font-medium">{title}</p>
  </>
);

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [isDesktopMenuOpen, setIsDesktopMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      // Fechar menus primeiro
      setIsOpen(false);
      setIsDesktopMenuOpen(false);

      // Fazer logout
      await signOut();

      // Aguardar um pouco e navegar (replace: true para não voltar)
      setTimeout(() => {
        navigate("/auth", { replace: true });
      }, 100);
    } catch (error) {
      console.error('Erro ao sair:', error);
      // Mesmo com erro, tentar navegar
      navigate("/auth", { replace: true });
    }
  };

  const handleNavClick = (path: string) => {
    navigate(path);
    setIsOpen(false);
    setIsDesktopMenuOpen(false);
  };

  const currentPath = location.pathname;

  return (
    <header className="sticky top-0 z-50 w-full theme-header shadow-soft">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 flex h-14 sm:h-16 items-center justify-between gap-2">
        {/* Left: Menu (mobile) + Logo */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {user && isMobile && (
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden shrink-0 h-10 w-10" aria-label="Abrir menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 overflow-y-auto">
                <SheetHeader className="text-left mb-4 pb-2">
                  <SheetTitle className="text-2xl font-bold bg-gradient-divine bg-clip-text text-transparent leading-normal pb-1">
                    Aliança
                  </SheetTitle>
                  <SheetDescription className="text-sm text-muted-foreground leading-normal">
                    Uma comunidade cristã moderna
                  </SheetDescription>
                </SheetHeader>

                <nav className="flex flex-col gap-0.5">
                  <MenuSection title="Principal" />
                  <MenuItem path="/bible" icon={<Book className="h-5 w-5" />} label="Bíblia" currentPath={currentPath} onClick={handleNavClick} />
                  <MenuItem path="/feed" icon={<Share2 className="h-5 w-5" />} label="Feed" currentPath={currentPath} onClick={handleNavClick} />
                  <MenuItem path="/chat" icon={<MessageSquare className="h-5 w-5" />} label="Chat" currentPath={currentPath} onClick={handleNavClick} />
                  <MenuItem path="/friends" icon={<Users className="h-5 w-5" />} label="Amigos" currentPath={currentPath} onClick={handleNavClick} />
                  <MenuItem path="/testimonies" icon={<Heart className="h-5 w-5" />} label="Depoimentos" currentPath={currentPath} onClick={handleNavClick} />
                  <MenuItem path="/prayers" icon={<Church className="h-5 w-5" />} label="Orações" currentPath={currentPath} onClick={handleNavClick} />

                  <MenuSection title="Ferramentas" />
                  <MenuItem path="/quiz" icon={<Brain className="h-5 w-5" />} label="Quiz" currentPath={currentPath} onClick={handleNavClick} iconColor="text-indigo-500" />
                  <MenuItem path="/challenges" icon={<Target className="h-5 w-5" />} label="Desafios" currentPath={currentPath} onClick={handleNavClick} iconColor="text-orange-500" />
                  <MenuItem path="/achievements" icon={<Trophy className="h-5 w-5" />} label="Conquistas" currentPath={currentPath} onClick={handleNavClick} iconColor="text-yellow-500" />
                  <MenuItem path="/gamification" icon={<Crown className="h-5 w-5" />} label="Selos Kingdom" currentPath={currentPath} onClick={handleNavClick} iconColor="text-amber-500" />
                  <MenuItem path="/ranking" icon={<TrendingUp className="h-5 w-5" />} label="Ranking" currentPath={currentPath} onClick={handleNavClick} iconColor="text-green-500" />
                  <MenuItem path="/palavra-viva" icon={<SearchIcon className="h-5 w-5" />} label="Caça-Palavras" currentPath={currentPath} onClick={handleNavClick} iconColor="text-purple-500" />

                  <MenuSection title="Estudo & Louvor" />
                  <MenuItem path="/favorite-verses" icon={<Heart className="h-5 w-5 fill-current" />} label="Versículos Favoritos" currentPath={currentPath} onClick={handleNavClick} iconColor="text-red-500" />
                  <MenuItem path="/devotional" icon={<Sparkles className="h-5 w-5" />} label="Devocional Diário" currentPath={currentPath} onClick={handleNavClick} iconColor="text-yellow-500" />
                  <MenuItem path="/studies" icon={<BookMarked className="h-5 w-5" />} label="Estudos Bíblicos" currentPath={currentPath} onClick={handleNavClick} iconColor="text-teal-500" />
                  <MenuItem path="/questions" icon={<HelpCircle className="h-5 w-5" />} label="Perguntas Bíblicas" currentPath={currentPath} onClick={handleNavClick} iconColor="text-blue-500" />
                  <MenuItem path="/dictionary" icon={<SearchIcon className="h-5 w-5" />} label="Dicionário Bíblico" currentPath={currentPath} onClick={handleNavClick} iconColor="text-indigo-500" />
                  <MenuItem path="/videos" icon={<Video className="h-5 w-5" />} label="Vídeos" currentPath={currentPath} onClick={handleNavClick} iconColor="text-red-500" />

                  <MenuSection title="Comunidade" />
                  <MenuItem path="/shared-reading" icon={<BookOpen className="h-5 w-5" />} label="Leitura em Grupo" currentPath={currentPath} onClick={handleNavClick} iconColor="text-violet-500" />
                  <MenuItem path="/church-community" icon={<Church className="h-5 w-5" />} label="Comunidade da Igreja" currentPath={currentPath} onClick={handleNavClick} iconColor="text-amber-500" />
                  <MenuItem path="/sobre-o-projeto" icon={<HandHeart className="h-5 w-5" />} label="Sobre o Projeto" currentPath={currentPath} onClick={handleNavClick} iconColor="text-amber-500" />

                  <MenuSection title="Conta" />
                  <div onClick={(e) => e.stopPropagation()}>
                    <NotificationPanel />
                  </div>
                  <div onClick={() => setIsOpen(false)}>
                    <PushNotificationToggle />
                  </div>
                  <MenuItem path="/favorites" icon={<Star className="h-5 w-5" />} label="Meus Favoritos" currentPath={currentPath} onClick={handleNavClick} iconColor="text-yellow-500" />
                  <MenuItem path="/profile" icon={<UserIcon className="h-5 w-5" />} label="Perfil" currentPath={currentPath} onClick={handleNavClick} />

                  <div className="h-px bg-border my-2" />
                  <Button
                    variant="ghost"
                    className="justify-start gap-3 h-11 text-base text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={handleLogout}
                    aria-label="Sair da conta"
                  >
                    <LogOut className="h-5 w-5 shrink-0" />
                    <span className="leading-normal">Sair</span>
                  </Button>
                </nav>
              </SheetContent>
            </Sheet>
          )}

          <Link to="/" className="flex items-center gap-2 sm:gap-3 group shrink-0">
            <div className="relative">
              <img
                src="/alianca-logo.png"
                alt="Aliança"
                className="h-14 w-14 sm:h-16 sm:w-16 lg:h-20 lg:w-20 object-contain drop-shadow-2xl transform transition-all duration-500 group-hover:scale-110 filter brightness-110 mix-blend-multiply"
              />
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 via-amber-500/20 to-orange-500/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500 -z-10" />
            </div>
            <span className="text-xl sm:text-2xl lg:text-3xl font-extrabold bg-gradient-to-r from-yellow-600 via-amber-600 to-orange-600 bg-clip-text text-transparent whitespace-nowrap leading-normal drop-shadow-lg group-hover:drop-shadow-2xl transition-all duration-300 tracking-tight">
              Aliança
            </span>
          </Link>
        </div>

        {/* Center: Desktop nav links ONLY (no notifications here) */}
        {user && (
          <nav className="hidden md:flex items-center gap-1 flex-nowrap overflow-x-auto scrollbar-hide px-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {[
              { path: "/bible", icon: <Book className="h-4 w-4 shrink-0" />, label: "Bíblia" },
              { path: "/testimonies", icon: <Heart className="h-4 w-4 shrink-0" />, label: "Depoimentos" },
              { path: "/prayers", icon: <Church className="h-4 w-4 shrink-0" />, label: "Orações" },
              { path: "/feed", icon: <Share2 className="h-4 w-4 shrink-0" />, label: "Feed" },
              { path: "/chat", icon: <MessageSquare className="h-4 w-4 shrink-0" />, label: "Chat" },
              { path: "/friends", icon: <Users className="h-4 w-4 shrink-0" />, label: "Amigos" },
            ].map(item => (
              <Link key={item.path} to={item.path} className="shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`inline-flex items-center gap-2 px-3 h-10 transition-all duration-300 ease-out ${
                    currentPath === item.path
                      ? "bg-primary/10 text-primary font-semibold shadow-sm scale-105"
                      : "hover:scale-110 hover:shadow-md hover:bg-muted/60"
                  }`}
                  aria-label={`Ir para ${item.label}`}
                >
                  {item.icon}
                  <span className="leading-normal text-sm whitespace-nowrap">{item.label}</span>
                </Button>
              </Link>
            ))}
          </nav>
        )}

        {/* Right: Notifications (outside overflow!) + Profile + Menu */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {user ? (
            <>
              {/* Notifications live HERE - outside the scrollable nav, no clipping */}
              <div className="hidden md:block">
                <NotificationPanel />
              </div>
              <div className="hidden md:block">
                <PushNotificationToggle />
              </div>

              <Link to="/profile">
                <Button variant="ghost" size="sm" className="gap-2 px-2 sm:px-3 h-10 hover:scale-105 transition-transform" aria-label="Ir para Perfil">
                  <UserIcon className="h-4 w-4 shrink-0" />
                  <span className="hidden sm:inline leading-normal text-sm">Perfil</span>
                </Button>
              </Link>
              <Button onClick={handleLogout} variant="ghost" size="sm" className="gap-2 px-2 sm:px-3 h-10 hover:scale-105 transition-transform" aria-label="Sair da conta">
                <LogOut className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline leading-normal text-sm">Sair</span>
              </Button>

              {/* Desktop secondary hamburger menu */}
              <Sheet open={isDesktopMenuOpen} onOpenChange={setIsDesktopMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="hidden md:inline-flex gap-2 px-2 sm:px-3 h-10 hover:scale-105 transition-transform" aria-label="Abrir menu secundário">
                    <Menu className="h-5 w-5 shrink-0" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 overflow-y-auto">
                  <SheetHeader className="text-left mb-4 pb-2">
                    <SheetTitle className="text-xl font-bold text-foreground leading-normal pb-1">Menu</SheetTitle>
                    <SheetDescription className="text-sm text-muted-foreground leading-normal">Acesso rápido</SheetDescription>
                  </SheetHeader>

                  <nav className="flex flex-col gap-0.5">
                    <MenuItem path="/videos" icon={<Video className="h-5 w-5" />} label="Vídeos" currentPath={currentPath} onClick={handleNavClick} iconColor="text-red-500" />
                    <MenuItem path="/shared-reading" icon={<BookOpen className="h-5 w-5" />} label="Leitura em Grupo" currentPath={currentPath} onClick={handleNavClick} iconColor="text-violet-500" />
                    <MenuItem path="/church-community" icon={<Church className="h-5 w-5" />} label="Comunidade da Igreja" currentPath={currentPath} onClick={handleNavClick} iconColor="text-amber-500" />
                    <MenuItem path="/sobre-o-projeto" icon={<HandHeart className="h-5 w-5" />} label="Sobre o Projeto" currentPath={currentPath} onClick={handleNavClick} iconColor="text-amber-500" />

                    <MenuSection title="Ferramentas" />
                    <MenuItem path="/achievements" icon={<Trophy className="h-5 w-5" />} label="Conquistas" currentPath={currentPath} onClick={handleNavClick} iconColor="text-yellow-500" />
                    <MenuItem path="/gamification" icon={<Crown className="h-5 w-5" />} label="Selos Kingdom" currentPath={currentPath} onClick={handleNavClick} iconColor="text-amber-500" />
                    <MenuItem path="/ranking" icon={<TrendingUp className="h-5 w-5" />} label="Ranking" currentPath={currentPath} onClick={handleNavClick} iconColor="text-green-500" />
                    <MenuItem path="/challenges" icon={<Target className="h-5 w-5" />} label="Desafios" currentPath={currentPath} onClick={handleNavClick} iconColor="text-orange-500" />
                    <MenuItem path="/quiz" icon={<Brain className="h-5 w-5" />} label="Quiz" currentPath={currentPath} onClick={handleNavClick} iconColor="text-indigo-500" />

                    <MenuSection title="Estudo & Louvor" />
                    <MenuItem path="/devotional" icon={<Sparkles className="h-5 w-5" />} label="Devocional Diário" currentPath={currentPath} onClick={handleNavClick} iconColor="text-yellow-500" />
                    <MenuItem path="/studies" icon={<BookMarked className="h-5 w-5" />} label="Estudos Bíblicos" currentPath={currentPath} onClick={handleNavClick} iconColor="text-teal-500" />
                    <MenuItem path="/questions" icon={<HelpCircle className="h-5 w-5" />} label="Perguntas Bíblicas" currentPath={currentPath} onClick={handleNavClick} iconColor="text-blue-500" />
                    <MenuItem path="/dictionary" icon={<SearchIcon className="h-5 w-5" />} label="Dicionário Bíblico" currentPath={currentPath} onClick={handleNavClick} iconColor="text-indigo-500" />
                    <MenuItem path="/favorites" icon={<Star className="h-5 w-5" />} label="Meus Favoritos" currentPath={currentPath} onClick={handleNavClick} iconColor="text-yellow-500" />
                    <MenuItem path="/palavra-viva" icon={<SearchIcon className="h-5 w-5" />} label="Caça-Palavras" currentPath={currentPath} onClick={handleNavClick} iconColor="text-purple-500" />

                    <div className="h-px bg-border my-2" />
                    <MenuItem path="/profile" icon={<UserIcon className="h-5 w-5" />} label="Perfil" currentPath={currentPath} onClick={handleNavClick} />
                    <Button variant="ghost" className="justify-start gap-3 h-11 text-base text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleLogout} aria-label="Sair">
                      <LogOut className="h-5 w-5 shrink-0" />
                      <span className="leading-normal">Sair</span>
                    </Button>
                  </nav>
                </SheetContent>
              </Sheet>
            </>
          ) : (
            <Link to="/auth">
              <Button className="bg-gradient-primary text-primary-foreground shadow-glow px-4 h-10">
                <span className="leading-normal">Entrar</span>
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
