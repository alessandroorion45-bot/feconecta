import { useState } from "react";
import Header from "@/components/Header";
import SEO from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DonationModal from "@/components/about/DonationModal";
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
} from "lucide-react";

const COSTS = [
  { icon: <Server className="h-5 w-5" />, label: "Hospedagem e servidores" },
  { icon: <Database className="h-5 w-5" />, label: "Banco de dados" },
  { icon: <Cloud className="h-5 w-5" />, label: "Armazenamento de arquivos e mídia" },
  { icon: <KeyRound className="h-5 w-5" />, label: "Domínio e certificados de segurança" },
  { icon: <Code2 className="h-5 w-5" />, label: "Manutenção e desenvolvimento" },
];

const AboutProject = () => {
  const [showDonationModal, setShowDonationModal] = useState(false);

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
    </div>
  );
};

export default AboutProject;
