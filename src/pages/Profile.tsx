import { useState, useEffect, lazy, Suspense } from "react";
import Header from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { ProfilePublicView } from "@/components/ProfilePublicView";
import { ProfileEditSheet } from "@/components/ProfileEditSheet";
import { ProfileSettingsSheet } from "@/components/ProfileSettingsSheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { pageCache, CACHE_TTL } from "@/lib/pageCache";
// import { ImageKitUploadTest } from "@/components/ImageKitUploadTest"; // Desabilitado temporariamente

// Lazy load heavy components to improve initial page load
const ProfilePhotos = lazy(() => import("@/components/ProfilePhotos"));
const ProfileVideos = lazy(() => import("@/components/ProfileVideos"));
const FriendTestimonials = lazy(() => import("@/components/FriendTestimonials"));

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
  church_role: string | null;
  ministries: string[];
}

const Profile = () => {
  console.log('[Profile] Componente iniciado');

  // TESTE DEFINITIVO: Alert que SEMPRE aparece
  if (typeof window !== 'undefined' && window.location.pathname === '/profile') {
    console.warn('🔴 PROFILE CARREGADO! Se você vê isso, o código está funcionando!');
    console.error('🚨 TESTE: Este erro DEVE aparecer em vermelho!');

    // ALERT FORÇADO - Vai aparecer como POPUP!
    alert('✅ CÓDIGO FUNCIONANDO! Se vê este popup, o JavaScript está rodando! Deploy atualizado em ' + new Date().toLocaleTimeString());
  }

  const { toast } = useToast();
  const { user } = useAuth();
  console.log('[Profile] User:', user?.email || 'não autenticado');
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData>({
    username: "",
    full_name: "",
    church_name: "",
    bio: "",
    city: "",
    avatar_url: "",
    cover_image_url: "",
    marital_status: "",
    is_private: false,
    profile_quote: "",
    church_role: null,
    ministries: [],
  });
  const [badges, setBadges] = useState<Badge[]>([]);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [settingsSheetOpen, setSettingsSheetOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfile(user.id);
    }
  }, [user]);

  const loadProfile = async (userId: string) => {
    setLoading(true);
    let startTime = performance.now(); // let para poder usar no finally

    try {
      // OTIMIZAÇÃO: Tentar cache primeiro
      const cacheKey = `profile_${userId}`;
      const cached = pageCache.get<{ profile: ProfileData; badges: Badge[] }>(cacheKey);

      if (cached) {
        console.log('✅ Perfil carregado do cache!');
        setProfile(cached.profile);
        setBadges(cached.badges);
        setLoading(false);
        return;
      }

      // 🔍 DEBUG DETALHADO - Reiniciar timer após cache check
      startTime = performance.now();
      console.log('═══════════════════════════════════════');
      console.log('🚀 INICIANDO CARREGAMENTO DO PERFIL');
      console.log('📋 User ID:', userId);
      console.log('⏰ Timestamp:', new Date().toISOString());
      console.log('═══════════════════════════════════════');

      const profilePromise = (async () => {
        console.log('📡 Enviando requisição para Supabase (PROFILE)...');
        const result = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        const endTime = performance.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);
        console.log(`⏱️ Profile query completou em ${duration}s`);
        console.log('📦 Dados recebidos:', result.data ? 'SIM' : 'NÃO');
        console.log('❌ Erro recebido:', result.error ? result.error.message : 'NÃO');

        return result;
      })();

      // 🚀 OTIMIZAÇÃO: Carregar PROFILE e BADGES em PARALELO
      console.log('⏳ Aguardando resposta em paralelo (timeout: 10s)...');

      const badgesPromise = (async () => {
        console.log('🏅 Carregando badges em paralelo...');
        return await supabase
          .from("user_badges")
          .select("badge_name, badge_icon, badge_color")
          .eq("user_id", userId)
          .order("display_order", { ascending: true })
          .limit(5);
      })();

      const timeoutPromise10s = new Promise<never>((_, reject) =>
        setTimeout(() => {
          const timeoutDuration = ((performance.now() - startTime) / 1000).toFixed(2);
          console.error(`⏰ TIMEOUT após ${timeoutDuration}s`);
          reject(new Error('PROFILE_TIMEOUT'));
        }, 10000) // 10 segundos (era 30s)
      );

      // Executar AMBAS as queries em PARALELO
      const [profileResult, badgesResult] = await Promise.race([
        Promise.all([profilePromise, badgesPromise]),
        timeoutPromise10s
      ]) as [Awaited<typeof profilePromise>, Awaited<typeof badgesPromise>];

      const { data, error } = profileResult;
      const { data: badgesData, error: badgesError } = badgesResult;

      if (error) {
        console.error('═══════════════════════════════════════');
        console.error('❌ ERRO NA QUERY DO PERFIL:');
        console.error('Código:', error.code);
        console.error('Mensagem:', error.message);
        console.error('Detalhes:', error.details);
        console.error('Hint:', error.hint);
        console.error('═══════════════════════════════════════');
        throw error;
      }

      if (!data) {
        console.warn('⚠️ Query completou mas SEM DADOS retornados!');
        console.warn('Isso pode significar que RLS bloqueou ou perfil não existe');
      } else {
        console.log('✅ PERFIL CARREGADO COM SUCESSO!');
        console.log('👤 Username:', data.username);
        console.log('📧 Full name:', data.full_name);

        setProfile({
          username: data.username || "",
          full_name: data.full_name || "",
          church_name: data.church_name || "",
          bio: data.bio || "",
          city: data.city || "",
          avatar_url: data.avatar_url || "",
          cover_image_url: data.cover_image_url || "",
          marital_status: data.marital_status || "",
          is_private: data.is_private || false,
          profile_quote: data.profile_quote || "",
          church_role: (data as any).church_role || null,
          ministries: (data as any).ministries || [],
        });
      }

      // Processar badges (já carregados em paralelo)
      if (badgesError) {
        console.warn('⚠️ Erro ao carregar badges:', badgesError.message);
      } else if (badgesData) {
        console.log(`✅ ${badgesData.length} badges carregados em paralelo`);
        setBadges(badgesData);
      } else {
        console.log('ℹ️ Nenhum badge encontrado');
      }

      // OTIMIZAÇÃO: Salvar no cache
      const profileData = {
        username: data?.username || "",
        full_name: data?.full_name || "",
        church_name: data?.church_name || "",
        bio: data?.bio || "",
        city: data?.city || "",
        avatar_url: data?.avatar_url || "",
        cover_image_url: data?.cover_image_url || "",
        marital_status: data?.marital_status || "",
        is_private: data?.is_private || false,
        profile_quote: data?.profile_quote || "",
        church_role: (data as any)?.church_role || null,
        ministries: (data as any)?.ministries || [],
      };

      pageCache.set(cacheKey, {
        profile: profileData,
        badges: badgesData || []
      }, CACHE_TTL.PROFILE);

      console.log('✅ Perfil salvo no cache!');
    } catch (error: any) {
      console.error('═══════════════════════════════════════');
      console.error('💥 EXCEÇÃO CAPTURADA:');
      console.error('Tipo:', error?.constructor?.name);
      console.error('Mensagem:', error?.message);
      console.error('Stack:', error?.stack);
      console.error('═══════════════════════════════════════');

      let errorMessage = 'Não foi possível carregar o perfil.';
      let errorTitle = 'Erro';

      if (error?.message === 'PROFILE_TIMEOUT') {
        errorMessage = '⏰ Timeout após 30 segundos. A conexão com o Supabase está muito lenta ou a query está bloqueada.';
        errorTitle = 'Tempo Esgotado';
      } else if (error?.code === 'PGRST116') {
        errorMessage = 'Perfil não encontrado no banco de dados.';
      } else if (error?.message?.includes('JWT')) {
        errorMessage = 'Sessão expirada. Faça login novamente.';
      } else if (error?.message) {
        errorMessage = error.message;
      }

      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      const totalTime = ((performance.now() - startTime) / 1000).toFixed(2);
      console.log('═══════════════════════════════════════');
      console.log(`🏁 FINALIZANDO (tempo total: ${totalTime}s)`);
      console.log('═══════════════════════════════════════');
      setLoading(false);
    }
  };

  const handleProfileUpdate = (updatedProfile: ProfileData) => {
    setProfile(updatedProfile);
  };

  const handlePrivacyUpdate = (isPrivate: boolean) => {
    setProfile({ ...profile, is_private: isPrivate });
  };

  const handleAvatarUpdate = async (url: string) => {
    if (!user) return;
    
    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: url })
      .eq("id", user.id);

    if (!error) {
      setProfile({ ...profile, avatar_url: url });
    }
  };

  const handleCoverUpdate = (url: string | null) => {
    setProfile({ ...profile, cover_image_url: url || "" });
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col">
      <Header />
      <main className="flex-1 w-full max-w-2xl mx-auto py-0 sm:py-6 md:py-8 px-0 sm:px-4">
        {/* Public Profile View */}
        <ProfilePublicView
          profile={profile}
          badges={badges}
          isOwner={true}
          userId={user?.id || ""}
          loading={loading}
          onEditClick={() => setEditSheetOpen(true)}
          onSettingsClick={() => setSettingsSheetOpen(true)}
          onAvatarUpdate={handleAvatarUpdate}
          onCoverUpdate={handleCoverUpdate}
        />

        {/* Photos Section - Lazy loaded with Suspense */}
        {user && !loading && (
          <div className="mt-6 px-4 sm:px-0">
            <Suspense fallback={
              <Card className="p-6">
                <Skeleton className="h-8 w-48 mb-4" />
                <div className="grid grid-cols-3 gap-2">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              </Card>
            }>
              <ProfilePhotos
                userId={user.id}
                isOwner={true}
              />
            </Suspense>
          </div>
        )}

        {/* Videos Section - Lazy loaded with Suspense */}
        {user && !loading && (
          <div className="mt-6 px-4 sm:px-0">
            <Suspense fallback={
              <Card className="p-6">
                <Skeleton className="h-8 w-48 mb-4" />
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-40 w-full" />
                  <Skeleton className="h-40 w-full" />
                </div>
              </Card>
            }>
              <ProfileVideos
                userId={user.id}
                isOwner={true}
              />
            </Suspense>
          </div>
        )}

        {/* ImageKit Upload Test - TEMPORARIAMENTE DESABILITADO */}
        {/* {user && !loading && (
          <div className="px-4 sm:px-0">
            <ImageKitUploadTest />
          </div>
        )} */}

        {/* Friend Testimonials Section - Lazy loaded with Suspense */}
        {user && !loading && (
          <div className="mt-6 px-4 sm:px-0">
            <Suspense fallback={
              <Card className="p-6">
                <Skeleton className="h-8 w-64 mb-4" />
                <Skeleton className="h-24 w-full mb-3" />
                <Skeleton className="h-24 w-full" />
              </Card>
            }>
              <FriendTestimonials
                profileId={user.id}
                profileName={profile.full_name || "Usuário"}
                isOwnProfile={true}
                isFriend={false}
                currentUserId={user.id}
              />
            </Suspense>
          </div>
        )}

        {/* Edit Profile Sheet (Slide-over Panel) */}
        {user && (
          <ProfileEditSheet
            open={editSheetOpen}
            onOpenChange={setEditSheetOpen}
            userId={user.id}
            profile={profile}
            onProfileUpdate={handleProfileUpdate}
          />
        )}

        {/* Settings Sheet */}
        {user && (
          <ProfileSettingsSheet
            open={settingsSheetOpen}
            onOpenChange={setSettingsSheetOpen}
            userId={user.id}
            isPrivate={profile.is_private}
            onPrivacyUpdate={handlePrivacyUpdate}
          />
        )}
      </main>
    </div>
  );
};

export default Profile;
