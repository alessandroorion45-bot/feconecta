import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import SEO from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import DonationModal from "@/components/about/DonationModal";
import { supabase } from "@/integrations/supabase/client";
import {
  HandHeart,
  Heart,
  Shield,
  Server,
  Database,
  Cloud,
  Code2,
  KeyRound,
  Sparkles,
  Users,
  PartyPopper,
  Clock,
  XCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const sb = supabase as any;

const COSTS = [
  { icon: <Server className="h-5 w-5" />, label: "Hospedagem e servidores" },
  { icon: <Database className="h-5 w-5" />, label: "Banco de dados" },
  { icon: <Cloud className="h-5 w-5" />, label: "Armazenamento de arquivos e mídia" },
  { icon: <KeyRound className="h-5 w-5" />, label: "Domínio e certificados de segurança" },
  { icon: <Code2 className="h-5 w-5" />, label: "Manutenção e desenvolvimento" },
];

interface Supporter {
  id: string;
  donor_name: string | null;
  donor_city: string | null;
  amount: number;
  created_at: string;
}

const AboutProject = () => {
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [thankYouStatus, setThankYouStatus] = useState<"success" | "pending" | "failure" | null>(null);
  const [supporters, setSupporters] = useState<Supporter[]>([]);

  useEffect(() => {
    const status = searchParams.get("status");
    if (status === "success" || status === "pending" || status === "failure") {
      setThankYouStatus(status);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const loadSupporters = useCallback(async () => {
    const { data } = await sb
      .from("donations")
      .select("id, donor_name, donor_city, amount, created_at")
      .eq("status", "approved")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(24);
    setSupporters(data || []);
  }, []);

  useEffect(() => {
    loadSupporters();
  }, [loadSupporters, thankYouStatus]);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        path="/sobre-o-projeto"
        title="Sobre o Projeto"
        description="Conheça a missão do Aliança Kingdom, nosso compromisso com o acesso gratuito e como você pode apoiar o projeto."
      />
      <Header />

      <main className="container max-w-5xl mx-auto py-6 px-4 pb-16">
        {/* Hero */}
        <div className="text-center pt-4 pb-10 md:pt-6 md:pb-14">
          <div className="inline-flex items-center justify-center p-4 bg-gradient-divine rounded-full mb-5 shadow-glow">
            <HandHeart className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold bg-gradient-divine bg-clip-text text-transparent leading-tight pb-1">
            Sobre o Aliança Kingdom
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto mt-4 leading-relaxed text-base md:text-lg">
            Um projeto feito com fé e dedicação para conectar pessoas, igrejas e comunidades
            em torno da Palavra de Deus — hoje e sempre, gratuitamente.
          </p>
        </div>

        {/* Missão */}
        <Card className="mb-6 border-primary/20 bg-card/60 backdrop-blur-sm">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-primary/10 shrink-0">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground mb-2">Nossa Missão</h2>
                <p className="text-muted-foreground leading-relaxed">
                  O Aliança Kingdom nasceu para ser um espaço digital onde a fé cristã encontra
                  comunidade: estudo bíblico, oração, discipulado, evangelismo e comunhão em um só
                  lugar. Acreditamos que ferramentas de qualidade para o Reino de Deus devem estar
                  ao alcance de todos, sem barreiras.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Compromisso de acesso gratuito */}
        <Card className="mb-6 border-primary/20 bg-card/60 backdrop-blur-sm">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-emerald-500/10 shrink-0">
                <Users className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground mb-2">Compromisso com o Acesso Gratuito</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Todos os recursos essenciais do Aliança Kingdom são e continuarão sendo
                  gratuitos. Nenhuma funcionalidade de estudo, comunhão ou crescimento espiritual
                  será bloqueada atrás de um pagamento. As doações são um apoio voluntário, nunca
                  uma exigência.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transparência / custos */}
        <Card className="mb-6 border-primary/20 bg-card/60 backdrop-blur-sm">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-start gap-4 mb-5">
              <div className="p-3 rounded-xl bg-blue-500/10 shrink-0">
                <Shield className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground mb-2">Transparência</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Manter o projeto no ar tem custos reais e recorrentes. Toda contribuição recebida
                  é usada exclusivamente para sustentar essa estrutura:
                </p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 pl-0 sm:pl-16">
              {COSTS.map((cost) => (
                <div
                  key={cost.label}
                  className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3"
                >
                  <span className="text-primary shrink-0">{cost.icon}</span>
                  <span className="text-sm text-foreground">{cost.label}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4 pl-0 sm:pl-16">
              Nenhum dado sensível ou valor individual é divulgado publicamente — apenas o destino
              geral dos recursos.
            </p>
          </CardContent>
        </Card>

        {/* CTA Doação */}
        <Card className="mb-6 overflow-hidden border-amber-500/30">
          <CardContent className="p-8 md:p-10 text-center bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-transparent">
            <Heart className="h-9 w-9 text-amber-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Quer fazer parte dessa jornada?
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto mb-6 leading-relaxed">
              Se o Aliança Kingdom tem abençoado sua caminhada de fé, considere apoiar o projeto.
              Cada contribuição, de qualquer valor, ajuda a mantê-lo gratuito e no ar para mais
              pessoas. Isso é um convite, não uma obrigação — sinta-se totalmente à vontade para
              apenas continuar aproveitando a plataforma.
            </p>
            <Button
              size="lg"
              onClick={() => setShowDonationModal(true)}
              className="h-12 px-8 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-white font-semibold hover:opacity-90 hover:scale-105 transition-all shadow-lg"
            >
              <HandHeart className="h-5 w-5 mr-2" />
              Fazer uma Doação
            </Button>
          </CardContent>
        </Card>

        {/* Mural de apoiadores (opt-in) */}
        {supporters.length > 0 && (
          <Card className="mb-6 border-primary/20 bg-card/60 backdrop-blur-sm">
            <CardContent className="p-6 md:p-8">
              <h2 className="text-xl font-bold text-foreground mb-1">Mural de Apoiadores</h2>
              <p className="text-sm text-muted-foreground mb-5">
                Pessoas que escolheram aparecer aqui como forma de incentivo à comunidade.
              </p>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                {supporters.map((s) => (
                  <div
                    key={s.id}
                    className="rounded-lg border border-border bg-muted/30 px-4 py-3"
                  >
                    <p className="font-medium text-foreground text-sm">
                      {s.donor_name || "Apoiador(a)"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {s.donor_city ? `${s.donor_city} · ` : ""}
                      {formatDistanceToNow(new Date(s.created_at), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rodapé com versículo */}
        <div className="text-center pt-6">
          <p className="text-muted-foreground italic max-w-lg mx-auto leading-relaxed">
            "Cada um contribua segundo propôs no seu coração, não com tristeza ou por
            obrigação; porque Deus ama ao que dá com alegria."
          </p>
          <p className="text-sm text-muted-foreground/70 mt-2">2 Coríntios 9:7</p>
        </div>
      </main>

      <DonationModal open={showDonationModal} onOpenChange={setShowDonationModal} />

      <Dialog open={thankYouStatus !== null} onOpenChange={(open) => !open && setThankYouStatus(null)}>
        <DialogContent className="sm:max-w-sm text-center">
          {thankYouStatus === "success" && (
            <>
              <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
                <PartyPopper className="h-7 w-7 text-emerald-500" />
              </div>
              <DialogHeader>
                <DialogTitle className="text-center">Muito obrigado! 🎉</DialogTitle>
                <DialogDescription className="text-center">
                  Sua doação foi recebida com alegria. Que Deus abençoe sua generosidade — ela ajuda
                  a manter o Aliança Kingdom gratuito para muitas outras pessoas.
                </DialogDescription>
              </DialogHeader>
            </>
          )}
          {thankYouStatus === "pending" && (
            <>
              <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10">
                <Clock className="h-7 w-7 text-amber-500" />
              </div>
              <DialogHeader>
                <DialogTitle className="text-center">Pagamento em processamento</DialogTitle>
                <DialogDescription className="text-center">
                  Recebemos sua doação e ela está sendo confirmada (comum em PIX ou boleto). Assim
                  que aprovada, o registro é atualizado automaticamente.
                </DialogDescription>
              </DialogHeader>
            </>
          )}
          {thankYouStatus === "failure" && (
            <>
              <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
                <XCircle className="h-7 w-7 text-destructive" />
              </div>
              <DialogHeader>
                <DialogTitle className="text-center">Não foi possível concluir</DialogTitle>
                <DialogDescription className="text-center">
                  O pagamento não foi aprovado. Nenhum valor foi cobrado. Fique à vontade para
                  tentar novamente quando quiser.
                </DialogDescription>
              </DialogHeader>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AboutProject;
