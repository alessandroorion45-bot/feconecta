import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import UserAvatar from "@/components/UserAvatar";
import SEO from "@/components/SEO";
import { Sparkles, Flame, Trophy, Lock, UserPlus, LogIn } from "lucide-react";
import "@/styles/live-fx.css";

export interface PublicVitrineData {
  user_id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  cover_image_url: string | null;
  bio: string | null;
  is_private: boolean;
  level: number;
  total_points: number;
  current_streak: number;
  member_since: string | null;
}

/**
 * Vitrine pública do perfil (visitante deslogado). Mostra SÓ dados não
 * sensíveis (nome, @, avatar, nível) vindos da RPC get_public_profile e
 * convida a criar conta. Nada de dados privados aqui.
 */
export const PublicProfileVitrine = ({ data }: { data: PublicVitrineData | null }) => {
  const navigate = useNavigate();

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-amber-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 flex flex-col items-center justify-center p-6 text-center">
        <SEO path="/profile" title="Perfil" description="Conheça a comunidade Aliança Kingdom." noindex />
        <p className="text-muted-foreground mb-4">Este perfil não foi encontrado.</p>
        <Button onClick={() => navigate("/auth")} className="!bg-gradient-to-r !from-amber-500 !to-orange-500 !text-white">
          Conhecer a Aliança
        </Button>
      </div>
    );
  }

  const memberSince = data.member_since
    ? new Date(data.member_since).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-100 via-white to-amber-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 flex flex-col items-center px-4 py-8">
      <SEO
        path={`/profile/${data.user_id}`}
        title={`${data.full_name} na Aliança Kingdom`}
        description={`${data.full_name} (@${data.username}) faz parte da Aliança Kingdom — comunidade cristã para ler a Bíblia, orar e crescer na fé.`}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
        className="w-full max-w-md"
      >
        <Card className="overflow-hidden shadow-2xl border-0">
          {/* Capa */}
          <div className="relative h-28 bg-gradient-to-br from-violet-500 via-purple-500 to-amber-500">
            {data.cover_image_url && (
              <img src={data.cover_image_url} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          </div>

          <CardContent className="relative pt-0 pb-6 px-6 text-center">
            {/* Avatar sobreposto */}
            <div className="-mt-12 mb-3 flex justify-center">
              <div className="rounded-full ring-4 ring-white dark:ring-zinc-900 shadow-xl">
                <UserAvatar src={data.avatar_url || undefined} fallback={data.full_name || "U"} className="h-24 w-24" />
              </div>
            </div>

            <h1 className="text-xl font-bold flex items-center justify-center gap-1.5">
              {data.full_name}
              {data.is_private && <Lock className="h-4 w-4 text-muted-foreground" />}
            </h1>
            <p className="text-sm text-muted-foreground">@{data.username}</p>

            {/* Stats de gamificação (públicas) */}
            <div className="flex items-center justify-center gap-3 mt-4">
              <div className="flex flex-col items-center px-3 py-2 rounded-xl bg-amber-500/10">
                <Trophy className="h-4 w-4 text-amber-500 mb-0.5" />
                <span className="text-sm font-bold">Nível {data.level}</span>
              </div>
              <div className="flex flex-col items-center px-3 py-2 rounded-xl bg-violet-500/10">
                <Sparkles className="h-4 w-4 text-violet-500 mb-0.5" />
                <span className="text-sm font-bold">{data.total_points} pts</span>
              </div>
              {data.current_streak > 0 && (
                <div className="flex flex-col items-center px-3 py-2 rounded-xl bg-orange-500/10">
                  <Flame className="h-4 w-4 text-orange-500 mb-0.5 icon-glow" />
                  <span className="text-sm font-bold">{data.current_streak} dias</span>
                </div>
              )}
            </div>

            {/* Bio (só se não for perfil privado) */}
            {data.bio && (
              <p className="text-sm text-foreground/80 mt-4 leading-relaxed">"{data.bio}"</p>
            )}
            {data.is_private && (
              <p className="text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1">
                <Lock className="h-3 w-3" /> Este perfil é privado. Entre para conectar-se.
              </p>
            )}

            {memberSince && (
              <p className="text-[11px] text-muted-foreground mt-3">Membro desde {memberSince}</p>
            )}

            {/* Convite pra entrar */}
            <div className="mt-6 pt-5 border-t space-y-2">
              <p className="text-sm font-medium mb-1">Faça parte desta jornada de fé 🙏</p>
              <Button
                onClick={() => navigate("/auth")}
                className="w-full !bg-gradient-to-r !from-amber-500 !to-orange-500 !text-white shadow-md"
              >
                <UserPlus className="h-4 w-4 mr-2" /> Criar minha conta grátis
              </Button>
              <Button variant="outline" className="w-full" onClick={() => navigate("/auth")}>
                <LogIn className="h-4 w-4 mr-2" /> Já tenho conta
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Aliança Kingdom · comunidade cristã para crescer na fé
        </p>
      </motion.div>
    </div>
  );
};

export default PublicProfileVitrine;
