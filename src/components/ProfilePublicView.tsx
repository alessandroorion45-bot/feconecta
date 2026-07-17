import { memo, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
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

  useEffect(() => {
    if (!userId) return;
    supabase
      .from("user_cosmetics")
      .select("cosmetic_key, tipo")
      .eq("user_id", userId)
      .eq("equipped", true)
      .then(({ data }) => setCosmetics(data || []));
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
          <img
            src={profile.cover_image_url}
            alt={`Capa do perfil de ${profile.full_name}`}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: "50% 40%" }}
            loading="lazy"
          />
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

        {/* Bottom gradient for smooth transition */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-card via-card/80 to-transparent" />
      </div>

      {/* Profile Header Section */}
      <div className="relative px-4 sm:px-6 -mt-12 sm:-mt-16 md:-mt-20">
        {/* Name - Full Width Centered */}
        <div className="text-center mb-4 pt-2">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground leading-tight uppercase tracking-wide break-words">
            {profile.full_name || "Seu Nome"}
          </h1>
        </div>

        {/* Avatar + Badges + Quote - Centered Column Layout */}
        <div className="flex flex-col items-center gap-3">
          {/* Avatar - 9:16 Portrait Format - Larger Size */}
          <div className="flex justify-center z-10">
            <AnimatedCosmeticFrame cosmeticKey={equippedFrame?.cosmetic_key}>
              {isOwner ? (
                <AvatarUpload
                  currentUrl={profile.avatar_url}
                  userId={userId}
                  onUploadComplete={onAvatarUpdate}
                  variant="rectangular"
                  fallbackName={profile.full_name}
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
          </div>

          {/* Badges + Quote - Centered Below Avatar */}
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
              {badges.length > 0 && (
                <Link
                  to="/gamification"
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground hover:text-foreground text-xs font-medium transition-colors"
                >
                  👑 Ver todos os selos
                </Link>
              )}

              {profile.is_private && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-200 text-xs font-medium">
                  <Lock className="h-3 w-3" />
                  Privado
                </span>
              )}
            </div>
            
            {/* Profile Quote */}
            {profile.profile_quote && (
              <p className="text-sm sm:text-base text-muted-foreground italic max-w-xs">
                "{profile.profile_quote}"
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <CardContent className="space-y-4 pt-6">
        {/* Info Card */}
        <div className="rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/10 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-primary/10 border-b border-primary/10">
            <User className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-primary">Informações</span>
          </div>
          <div className="p-4 space-y-3">
            {profile.marital_status && (
              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-rose-100 dark:bg-rose-900/30">
                  <Heart className="h-4 w-4 text-rose-500" />
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Relacionamento</span>
                  <p className="font-medium">
                    {MARITAL_STATUS_LABELS[profile.marital_status] || profile.marital_status} 💍
                  </p>
                </div>
              </div>
            )}
            
            {profile.church_name && (
              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10">
                  <Church className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Comunidade</span>
                  <p className="font-medium">{profile.church_name} 🛐</p>
                </div>
              </div>
            )}

            {profile.church_role && CHURCH_ROLE_LABELS[profile.church_role] && (
              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30">
                  <Star className="h-4 w-4 text-indigo-600" />
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Vínculo com a Igreja</span>
                  <p className="font-medium">
                    {CHURCH_ROLE_LABELS[profile.church_role].label} {CHURCH_ROLE_LABELS[profile.church_role].icon}
                  </p>
                </div>
              </div>
            )}
            
            {profile.city && (
              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/30">
                  <MapPin className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Localização</span>
                  <p className="font-medium">{profile.city} 🌞</p>
                </div>
              </div>
            )}

            {!profile.marital_status && !profile.church_name && !profile.city && !profile.church_role && (
              <p className="text-sm text-muted-foreground text-center py-2">
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
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}
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
        <div className="rounded-xl bg-muted/50 border border-border/50 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-muted/80 border-b border-border/50">
            <BookOpen className="h-4 w-4 text-foreground/70" />
            <span className="text-sm font-semibold text-foreground/80">Sobre mim</span>
          </div>
          <div className="p-4">
            {profile.bio ? (
              <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap italic">
                {profile.bio}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground italic text-center">
                Nenhuma descrição adicionada ainda.
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Link to="/achievements">
            <Button variant="outline" className="w-full gap-2 group rounded-xl h-12">
              <Trophy className="h-4 w-4 group-hover:text-amber-500 transition-colors" />
              <span className="text-sm">Conquistas</span>
            </Button>
          </Link>
          <Link to="/ranking">
            <Button variant="outline" className="w-full gap-2 group rounded-xl h-12">
              <Medal className="h-4 w-4 group-hover:text-primary transition-colors" />
              <span className="text-sm">Ranking</span>
            </Button>
          </Link>
        </div>

        {/* Edit Profile Button - Repositioned below info section */}
        {isOwner && (
          <Button
            onClick={onEditClick}
            className="w-full gap-2 bg-gradient-primary text-primary-foreground rounded-xl h-12 mt-2"
          >
            <Pencil className="h-4 w-4" />
            Editar Perfil
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
