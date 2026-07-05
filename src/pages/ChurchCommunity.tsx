import { useState, useEffect, memo } from "react";
import { useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Church, Plus, Search } from "lucide-react";
import CommunityList from "@/components/church-community/CommunityList";
import CommunityDetail from "@/components/church-community/CommunityDetail";
import CreateCommunityModal from "@/components/church-community/CreateCommunityModal";
import CommunityWelcomeModal from "@/components/church-community/CommunityWelcomeModal";

const ChurchCommunity = () => {
  const { toast } = useToast();
  const { user, isLoading } = useAuth();
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const [joinTarget, setJoinTarget] = useState<{ id: string; name: string } | null>(null);

  // Link de convite: /church-community?join=<id> (compartilhar/QR Code)
  useEffect(() => {
    const joinId = searchParams.get("join");
    if (!joinId || !user) return;

    (async () => {
      const { data: membership } = await supabase
        .from("church_community_members")
        .select("id")
        .eq("community_id", joinId)
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (membership) {
        setSelectedCommunityId(joinId);
      } else {
        const { data: community } = await supabase
          .from("church_communities")
          .select("id, name")
          .eq("id", joinId)
          .maybeSingle();
        if (community) {
          setJoinTarget({ id: community.id, name: community.name });
        } else {
          toast({ title: "Convite inválido", description: "Comunidade não encontrada.", variant: "destructive" });
        }
      }
      setSearchParams({}, { replace: true });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Comunidade da Igreja | Aliança</title>
        <meta name="description" content="Participe de decisões coletivas e avalie líderes na comunidade da sua igreja." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container max-w-7xl mx-auto py-6 px-4">
          {/* Hero Section */}
          <div className="mb-8 text-center pt-2 md:pt-3">
            <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-full mb-4">
              <Church className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3 leading-tight md:leading-normal pt-1">
              Comunidade da Igreja
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Um espaço democrático e espiritual onde todos são iguais perante Deus. 
              Participe de votações, avalie líderes e construa uma comunidade unida em fé.
            </p>
          </div>

          {/* Spiritual Message */}
          <Card className="mb-6 bg-primary/5 border-primary/20">
            <CardContent className="py-4 text-center">
              <p className="text-primary italic">
                "Porque onde dois ou três estiverem reunidos em meu nome, ali estou no meio deles." — Mateus 18:20
              </p>
            </CardContent>
          </Card>

          {selectedCommunityId ? (
            <CommunityDetail 
              communityId={selectedCommunityId} 
              userId={user?.id || ""} 
              onBack={() => setSelectedCommunityId(null)}
            />
          ) : (
            <>
              {/* Search and Create */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar comunidades..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button 
                  onClick={() => setShowCreateModal(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Comunidade
                </Button>
              </div>

              {/* Community List */}
              <CommunityList 
                userId={user?.id || ""} 
                searchQuery={searchQuery}
                onSelectCommunity={setSelectedCommunityId}
                refreshTrigger={refreshTrigger}
              />
            </>
          )}
        </main>

        {/* Create Modal */}
        {/* Entrada via link/QR de convite */}
        {joinTarget && user && (
          <CommunityWelcomeModal
            open={!!joinTarget}
            onOpenChange={(o) => !o && setJoinTarget(null)}
            communityId={joinTarget.id}
            communityName={joinTarget.name}
            userId={user.id}
            onJoined={() => {
              const id = joinTarget.id;
              setJoinTarget(null);
              setRefreshTrigger(prev => prev + 1);
              setSelectedCommunityId(id);
            }}
          />
        )}

        <CreateCommunityModal
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
          userId={user?.id || ""}
          onSuccess={() => {
            setShowCreateModal(false);
            setRefreshTrigger(prev => prev + 1);
            toast({
              title: "✅ Comunidade criada com sucesso!",
              description: "Sua comunidade já está disponível em 'Minhas Comunidades'.",
            });
          }}
        />
      </div>
    </>
  );
};

export default memo(ChurchCommunity);
