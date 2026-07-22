import { memo, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { BACKGROUND_STYLES, EFFECT_STYLES } from "@/lib/cosmetics";
import AnimatedCosmeticFrame from "@/components/AnimatedCosmeticFrame";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AvatarPro } from "@/components/AvatarPro";
import { Skeleton } from "@/components/ui/skeleton";
import { Church, MapPin, Trophy, Lock, Heart, Pencil, Medal, User, BookOpen, Quote, Users, Music, HeartHandshake, Baby, Megaphone, Monitor, HandHeart, Star } from "lucide-react";
import { UserBadge } from "./UserBadge";
import { AvatarUpload } from "./AvatarUpload";
import ProfileStats from "@/components/profile/ProfileStats";
import ProfileBadgesShowcase from "@/components/profile/ProfileBadgesShowcase";
import ProfileGifts from "@/components/profile/ProfileGifts";
import { ProfileEditHub } from "@/components/ProfileEditHub";

interface Badge {
  badge_name: string;
  badge_icon: string;
  badge_color: string;
}

interface ProfileData {
  username: string;
  full_name: string;
  church_name: string;
  bio: string;
  city: string;
  avatar_url: string;
  cover_image_url: string;
  marital_status: string;
  is_private: boolean;
  profile_quote: string;
  church_role?: string;
  ministries?: string[];
}

const CHURCH_ROLE_LABELS: Record<string, { label: string; icon: string }> = {
  membro: { label: "Membro Ativo", icon: "👤" },
  visitante: { label: "Visitante", icon: "🙋" },
  lider: { label: "Líder Espiritual", icon: "⭐" },
  pastor: { label: "Pastor(a)", icon: "🛐" },
  voluntario: { label: "Voluntário(a)", icon: "🤝" },
};

const MINISTRY_CONFIG: Record<string, { label: string; color: string }> = {
  louvor: { label: "Louvor", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
  danca: { label: "Dança", color: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300" },
  intercessao: { label: "Intercessão", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  infantil: { label: "Infantil", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300" },
  evangelismo: { label: "Evangelismo", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  multimidia: { label: "Multimídia", color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300" },
  acao_social: { label: "Ação Social", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" },
};

interface ProfilePublicViewProps {
  profile: ProfileData;
  badges: Badge[];
  isOwner: boolean;
  userId: string;
  loading: boolean;
  onEditClick: () => void;
  onSettingsClick: () => void;
  onAvatarUpdate: (url: string) => void;
  onCoverUpdate: (url: string | null) => void;
}

const MARITAL_STATUS_LABELS: Record<string, string> = {
  solteiro: "Solteiro",
  solteira: "Solteira",
  casado: "Casado",
  casada: "Casada",
};

export const ProfilePublicView = ({
  profile,
  badges,
  isOwner,
  userId,
  loading,
  onEditClick,
  onSettingsClick,
  onAvatarUpdate,
  onCoverUpdate,
}: ProfilePublicViewProps) => {
  // Cosméticos da Kingdom Store equipados por esse usuário
  const [cosmetics, setCosmetics] = useState<{ cosmetic_key: string; tipo: string }[]>([]);
  // Título do Reino (vem do ProfileStats — mesmo fetch, sem consulta extra)
  const [kingdomTitle, setKingdomTitle] = useState<{ title: string; level: number } | null>(null);
  // Contadores só-leitura: conquistas e posição no ranking
  const [achievementsCount, setAchievementsCount] = useState<number | null>(null);
  const [rankPosition, setRankPosition] = useState<number | null>(null);
  // Hub "Editar Perfil" — um botão só, com atalhos pra ações que já existiam
  const [hubOpen, setHubOpen] = useState(false);
  const [avatarPickerTrigger, setAvatarPickerTrigger] = useState<(() => void) | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) return;
    supabase
      .from("user_cosmetics")
      .select("cosmetic_key, tipo")
      .eq("user_id", userId)
      .eq("equipped", true)
      .then(({ data }) => setCosmetics(data || []));

    (async () => {
      const { count } = await supabase
        .from("user_achievements")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);
      setAchievementsCount(count ?? 0);

      // posição = quantos têm mais pontos + 1 (mesmo critério da página de Ranking)
      const { data: myStats } = await supabase
        .from("user_stats")
        .select("total_points")
        .eq("user_id", userId)
        .maybeSingle();
      const myPoints = myStats?.total_points ?? 0;
      const { count: ahead } = await supabase
        .from("user_stats")
        .select("user_id", { count: "exact", head: true })
        .gt("total_points", myPoints);
      setRankPosition((ahead ?? 0) + 1);
    })();
  }, [userId]);

  const equippedFrame = cosmetics.find((c) => c.tipo === "moldura");
  const equippedBg = cosmetics.find((c) => c.tipo === "fundo");
  const equippedFx = cosmetics.find((c) => c.tipo === "efeito");
  const bgStyle = equippedBg ? BACKGROUND_STYLES[equippedBg.cosmetic_key] : null;
  const fxStyle = equippedFx ? EFFECT_STYLES[equippedFx.cosmetic_key] : null;

  if (loading) {
    return (
      <Card className="shadow-sm overflow-hidden rounded-none sm:rounded-xl">
        <Skeleton className="w-full h-[220px] sm:h-[280px] md:h-[320px]" />
        <div className="p-4 sm:p-6 space-y-4">
          <div className="flex gap-4">
            <Skeleton className="h-[72px] w-[72px] sm:h-24 sm:w-24 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm overflow-hidden rounded-none sm:rounded-xl border-0 sm:border">
      {/* Cover Image with Gradient Overlay */}
      <div className="relative w-full h-[220px] sm:h-[280px] md:h-[320px] overflow-hidden">
        {profile.cover_image_url ? (
          <AnimatePresence mode="popLayout">
            <motion.img
              key={profile.cover_image_url}
              src={profile.cover_image_url}
              alt={`Capa do perfil de ${profile.full_name}`}
              className="absolute inset-0 w-full h-full object-cover motion-reduce:!scale-100"
              style={{ objectPosition: "50% 40%" }}
              loading="lazy"
              initial={{ opacity: 0, scale: 1.06 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </AnimatePresence>
        ) : bgStyle ? (
          <div className="absolute inset-0" style={{ background: bgStyle }} />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-accent/30 to-secondary/20" />
        )}

        {/* Efeito visual equipado (Kingdom Store) — leve, some com prefers-reduced-motion */}
        {fxStyle && (
          <div className="absolute inset-0 pointer-events-none motion-reduce:hidden" aria-hidden>
            {[...Array(fxStyle.count)].map((_, i) => (
              <motion.span
                key={i}
                className="absolute text-lg opacity-70"
                style={{ left: `${8 + ((i * 89) % 84)}%` }}
                initial={{ y: "110%", opacity: 0 }}
                animate={{ y: "-10%", opacity: [0, 0.7, 0] }}
                transition={{ duration: 6 + (i % 4), repeat: Infinity, delay: i * 0.9, ease: "linear" }}
              >
                {fxStyle.emoji}
              </motion.span>
            ))}
          </div>
        )}

        {/* Scrim bem sutil — só o suficiente pro avatar/badge que sobrepõem
            a capa (margin negativo abaixo) terem contraste, sem esconder
            a foto. Era uma faixa opaca da cor do card cobrindo ~30% da
            capa; agora é praticamente transparente até os últimos 35%. */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(180deg, transparent 65%, rgba(0,0,0,0.18) 100%)" }}
        />
      </div>

      {/* Profile Header Section — cartão de identidade.
          Ordem: avatar (só ele sobrepõe a capa, ~35% da própria altura)
          → nome → título do Reino → outros selos → frase. Nome e selos
          nunca tocam a capa — só o avatar, que é o elemento pensado pra
          isso (moldura/glow já dão contraste próprio). */}
      <div className="relative px-4 sm:px-6 -mt-11 sm:-mt-14">
        {/* Avatar - 9:16 Portrait Format - Larger Size */}
        <div className="flex justify-center z-10">
          {equippedFrame ? (
              <AnimatedCosmeticFrame cosmeticKey={equippedFrame.cosmetic_key}>
                {isOwner ? (
                  <AvatarUpload
                    currentUrl={profile.avatar_url}
                    userId={userId}
                    onUploadComplete={onAvatarUpdate}
                    variant="rectangular"
                    fallbackName={profile.full_name}
                    onTriggerReady={(fn) => setAvatarPickerTrigger(() => fn)}
                  />
                ) : (
                  <AvatarPro
                    src={profile.avatar_url}
                    name={profile.full_name}
                    userId={userId}
                    size="xl"
                    clickable={false}
                  />
                )}
              </AnimatedCosmeticFrame>
            ) : (
              <motion.div
                className="relative rounded-2xl p-[3px] overflow-hidden"
                style={{ background: "linear-gradient(135deg, #fde68a, #d4930d 55%, #fde68a)" }}
                animate={{
                  boxShadow: [
                    "0 0 14px rgba(212,147,13,0.25)",
                    "0 0 26px rgba(212,147,13,0.45)",
                    "0 0 14px rgba(212,147,13,0.25)",
                  ],
                }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              >
                {/* pequeno brilho girando lentamente na borda */}
                <motion.div
                  aria-hidden
                  className="absolute -inset-[150%] pointer-events-none motion-reduce:hidden"
                  style={{
                    background:
                      "conic-gradient(from 0deg, transparent 0%, rgba(255,255,255,0.7) 5%, transparent 12%, transparent 100%)",
                  }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
                />
                <div className="relative rounded-xl overflow-hidden bg-card">
                  {isOwner ? (
                    <AvatarUpload
                      currentUrl={profile.avatar_url}
                      userId={userId}
                      onUploadComplete={onAvatarUpdate}
                      variant="rectangular"
                      fallbackName={profile.full_name}
                      onTriggerReady={(fn) => setAvatarPickerTrigger(() => fn)}
                    />
                  ) : (
                    <AvatarPro
                      src={profile.avatar_url}
                      name={profile.full_name}
                      userId={userId}
                      size="xl"
                      clickable={false}
                    />
                  )}
                </div>
              </motion.div>
            )}
        </div>

        {/* Name - Full Width Centered, abaixo do avatar, nunca sobre a capa */}
        <div className="text-center mt-3 mb-3">
          <motion.h1
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="text-lg sm:text-xl md:text-2xl font-extrabold text-foreground leading-tight uppercase tracking-wide break-words"
          >
            {profile.full_name || "Seu Nome"}
          </motion.h1>

          {/* Título do Reino (baseado no nível — helper puro da lib de gamificação) */}
          {kingdomTitle && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="mt-1.5 inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/25 pl-1.5 pr-3 py-1 text-xs sm:text-sm font-semibold text-amber-700 dark:text-amber-300"
            >
              {/* Medalha do nível */}
              <span
                className="inline-flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full text-[10px] sm:text-[11px] font-bold text-amber-950 shadow-[inset_0_1px_2px_rgba(255,255,255,0.6),0_1px_3px_rgba(180,120,10,0.45)] ring-1 ring-amber-600/40"
                style={{ background: "radial-gradient(circle at 32% 28%, #fef3c7, #fbbf24 55%, #d4930d)" }}
              >
                {kingdomTitle.level}
              </span>
              👑 {kingdomTitle.title}
            </motion.p>
          )}
        </div>

        {/* Badges + Quote - Centered Below Name */}
        <div className="flex flex-col items-center gap-2 text-center">
          {/* Title Badges */}
          <div className="flex flex-wrap gap-2 justify-center">
            {badges.length > 0 && badges.map((badge, index) => (
              <UserBadge
                key={index}
                icon={badge.badge_icon}
                name={badge.badge_name}
                color={badge.badge_color}
                size="sm"
              />
            ))}

            {profile.is_private && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-200 text-xs font-medium">
                <Lock className="h-3 w-3" />
                Privado
              </span>
            )}
          </div>

          {/* Profile Quote — versículo/frase favorita em cartão */}
          {profile.profile_quote && (
            <div className="rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.07] to-transparent px-4 py-2.5 max-w-sm">
              <p className="text-sm sm:text-base text-foreground/85 italic text-center flex items-start gap-1.5 justify-center">
                <span className="text-base leading-none mt-0.5">📖</span>
                <span>"{profile.profile_quote}"</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Content Sections */}
      <CardContent className="space-y-4 pt-6">
        {/* Resumo do Perfil + barra de evolução */}
        <ProfileStats userId={userId} onTitleLoaded={(title, level) => setKingdomTitle({ title, level })} />

        {/* 🏆 Meus Selos */}
        <ProfileBadgesShowcase userId={userId} />

        {/* 🎁 Presentes Recebidos (só o dono vê — RLS) */}
        <ProfileGifts userId={userId} isOwner={isOwner} />

        {/* Info Card — mini-cards em grade */}
        <div className="rounded-2xl bg-card/60 backdrop-blur-sm border border-border/60 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-[250ms]">
          <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-primary/10 to-transparent border-b border-border/50">
            <User className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-primary">Informações</span>
          </div>
          <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {profile.marital_status && (
              <div className="flex items-center gap-3 text-sm rounded-xl border border-border/50 bg-muted/30 px-3 py-2.5 hover:border-rose-300/50 transition-colors duration-[250ms]">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-rose-100 dark:bg-rose-900/30 shrink-0">
                  <Heart className="h-4 w-4 text-rose-500" />
                </div>
                <div className="min-w-0">
                  <span className="text-muted-foreground text-xs">Relacionamento</span>
                  <p className="font-medium truncate">
                    {MARITAL_STATUS_LABELS[profile.marital_status] || profile.marital_status} 💍
                  </p>
                </div>
              </div>
            )}

            {profile.church_name && (
              <div className="flex items-center gap-3 text-sm rounded-xl border border-border/50 bg-muted/30 px-3 py-2.5 hover:border-primary/40 transition-colors duration-[250ms]">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 shrink-0">
                  <Church className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <span className="text-muted-foreground text-xs">Comunidade</span>
                  <p className="font-medium truncate">{profile.church_name} 🛐</p>
                </div>
              </div>
            )}

            {profile.church_role && CHURCH_ROLE_LABELS[profile.church_role] && (
              <div className="flex items-center gap-3 text-sm rounded-xl border border-border/50 bg-muted/30 px-3 py-2.5 hover:border-indigo-300/50 transition-colors duration-[250ms]">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 shrink-0">
                  <Star className="h-4 w-4 text-indigo-600" />
                </div>
                <div className="min-w-0">
                  <span className="text-muted-foreground text-xs">Vínculo com a Igreja</span>
                  <p className="font-medium truncate">
                    {CHURCH_ROLE_LABELS[profile.church_role].label} {CHURCH_ROLE_LABELS[profile.church_role].icon}
                  </p>
                </div>
              </div>
            )}

            {profile.city && (
              <div className="flex items-center gap-3 text-sm rounded-xl border border-border/50 bg-muted/30 px-3 py-2.5 hover:border-amber-300/50 transition-colors duration-[250ms]">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/30 shrink-0">
                  <MapPin className="h-4 w-4 text-amber-600" />
                </div>
                <div className="min-w-0">
                  <span className="text-muted-foreground text-xs">Localização</span>
                  <p className="font-medium truncate">{profile.city} 🌞</p>
                </div>
              </div>
            )}

            {!profile.marital_status && !profile.church_name && !profile.city && !profile.church_role && (
              <p className="text-sm text-muted-foreground text-center py-2 sm:col-span-2">
                Nenhuma informação adicionada ainda.
              </p>
            )}
          </div>

          {/* Ministries Section */}
          {profile.ministries && profile.ministries.length > 0 && (
            <div className="px-4 pb-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium text-muted-foreground">Ministérios</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.ministries.map((ministry) => {
                  const config = MINISTRY_CONFIG[ministry];
                  if (!config) return null;
                  return (
                    <span
                      key={ministry}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium hover:scale-[1.04] transition-transform duration-[250ms] ${config.color}`}
                    >
                      {config.label}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Bio Card */}
        <div className="rounded-2xl bg-card/60 backdrop-blur-sm border border-border/60 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-[250ms]">
          <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-muted/80 to-transparent border-b border-border/50">
            <BookOpen className="h-4 w-4 text-foreground/70" />
            <span className="text-sm font-semibold text-foreground/80">Sobre mim</span>
          </div>
          <div className="p-4 sm:p-5">
            <div className="mx-auto mb-3 h-[2px] w-12 rounded-full bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
            {profile.bio ? (
              <p className="text-[15px] text-foreground/90 leading-7 whitespace-pre-wrap">
                {profile.bio}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground italic text-center">
                ✨ Este membro ainda não escreveu sobre sua caminhada.
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Link to="/achievements">
            <Button variant="outline" className="w-full gap-2 group rounded-xl h-12 hover:border-amber-400/50 hover:shadow-[0_0_16px_rgba(212,147,13,0.15)] transition-all duration-[250ms]">
              <Trophy className="h-4 w-4 group-hover:text-amber-500 group-hover:scale-110 transition-all duration-[250ms]" />
              <span className="text-sm">
                {achievementsCount !== null && achievementsCount > 0 ? `${achievementsCount} Conquistas` : "Conquistas"}
              </span>
            </Button>
          </Link>
          <Link to="/ranking">
            <Button variant="outline" className="w-full gap-2 group rounded-xl h-12 hover:border-primary/50 hover:shadow-[0_0_16px_rgba(59,130,246,0.15)] transition-all duration-[250ms]">
              <Medal className="h-4 w-4 group-hover:text-primary group-hover:scale-110 transition-all duration-[250ms]" />
              <span className="text-sm">
                {rankPosition !== null ? (
                  <>
                    {rankPosition === 1 ? "🥇" : rankPosition === 2 ? "🥈" : rankPosition === 3 ? "🥉" : "🏅"} #{rankPosition} no Ranking
                  </>
                ) : (
                  "Ranking"
                )}
              </span>
            </Button>
          </Link>
        </div>

        {/* Edit Profile Button - abre o hub com todos os atalhos de gerenciamento */}
        {isOwner && (
          <Button
            onClick={() => setHubOpen(true)}
            className="w-full gap-2 bg-gradient-primary text-primary-foreground rounded-xl h-12 mt-2 border border-transparent hover:!bg-gradient-to-r hover:!from-amber-400 hover:!to-amber-500 hover:!text-amber-950 hover:border-amber-300/60 hover:shadow-lg hover:shadow-amber-500/30 hover:scale-[1.01] transition-all duration-[250ms]"
          >
            <Pencil className="h-4 w-4" />
            Editar Perfil
          </Button>
        )}
      </CardContent>

      {isOwner && (
        <ProfileEditHub
          open={hubOpen}
          onOpenChange={setHubOpen}
          onEditInfo={onEditClick}
          onChangeAvatar={() => avatarPickerTrigger?.()}
          onAddPhotos={() => document.getElementById("profile-photos-section")?.scrollIntoView({ behavior: "smooth", block: "start" })}
          onAddVideo={() => document.getElementById("profile-videos-section")?.scrollIntoView({ behavior: "smooth", block: "start" })}
          onChangeTheme={() => navigate("/themes")}
          onPrivacy={onSettingsClick}
        />
      )}
    </Card>
  );
};
