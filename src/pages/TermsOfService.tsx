import Header from "@/components/Header";
import SEO from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { BookOpen, HeartHandshake, ShieldAlert, Gift, UserX, Scale, Mail } from "lucide-react";

const LAST_UPDATE = "19 de julho de 2026";
const CONTACT_EMAIL = "alessandro.r.business@gmail.com";

const Section = ({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) => (
  <section className="space-y-2">
    <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
        {icon}
      </span>
      {title}
    </h2>
    <div className="text-[15px] leading-7 text-foreground/85 space-y-3 pl-10">{children}</div>
  </section>
);

const TermsOfService = () => (
  <div className="min-h-screen bg-background">
    <SEO
      path="/termos"
      title="Termos de Serviço"
      description="Termos de uso da plataforma Aliança Kingdom: regras de convivência, conteúdo, doações e responsabilidades."
    />
    <Header />
    <main className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Termos de Serviço</h1>
        <p className="text-sm text-muted-foreground">Última atualização: {LAST_UPDATE}</p>
      </div>

      <Card className="rounded-2xl border-border/60 bg-card/60 backdrop-blur-sm">
        <CardContent className="p-6 sm:p-8 space-y-8">
          <p className="text-[15px] leading-7 text-foreground/85">
            Bem-vindo(a) ao <strong>Aliança Kingdom</strong> (aliancakingdom.com.br), uma comunidade
            cristã online para edificação, estudo bíblico, oração e comunhão. Ao criar uma conta ou usar
            a plataforma, você concorda com estes termos.
          </p>

          <Section icon={<BookOpen className="h-4 w-4" />} title="O que é a plataforma">
            <p>
              O Aliança Kingdom oferece gratuitamente: feed da comunidade, leitura e estudo da Bíblia,
              pedidos de oração, testemunhos, comunidades de igreja, jogos bíblicos e sistema de
              conquistas. Todo o conteúdo bíblico e devocional é e continuará sendo{" "}
              <strong>gratuito</strong>.
            </p>
          </Section>

          <Section icon={<HeartHandshake className="h-4 w-4" />} title="Regras de convivência">
            <p>
              Esta é uma comunidade de fé. Ao participar, você se compromete a tratar os demais membros
              com amor e respeito. Não são tolerados:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Ofensas, assédio, discriminação ou discurso de ódio;</li>
              <li>Conteúdo impróprio, violento, sexual ou ilegal;</li>
              <li>Spam, correntes, golpes ou pedidos de dinheiro entre membros;</li>
              <li>Perfis falsos ou que se passem por outra pessoa;</li>
              <li>Divulgação de dados pessoais de terceiros sem consentimento.</li>
            </ul>
            <p>
              Conteúdos que violem estas regras podem ser removidos e a conta responsável pode ser
              suspensa ou encerrada.
            </p>
          </Section>

          <Section icon={<Scale className="h-4 w-4" />} title="Seu conteúdo">
            <p>
              O que você publica continua sendo seu. Ao publicar, você nos autoriza apenas a exibir esse
              conteúdo dentro da plataforma para os demais membros, conforme suas configurações de
              privacidade. Você é responsável pelo que publica.
            </p>
          </Section>

          <Section icon={<Gift className="h-4 w-4" />} title="Doações e Kingdom Store">
            <p>
              As doações são voluntárias e destinadas à manutenção da plataforma (servidores, banco de
              dados, domínio). A Kingdom Store vende apenas <strong>itens digitais cosméticos e
              colecionáveis</strong> (selos de apoiador, molduras, presentes) — nada que conceda vantagem
              espiritual ou funcional. Pagamentos são processados pelo Mercado Pago. Itens digitais são
              entregues imediatamente após a confirmação; por sua natureza, não são reembolsáveis, exceto
              nos casos previstos em lei (CDC).
            </p>
          </Section>

          <Section icon={<ShieldAlert className="h-4 w-4" />} title="Limitações e disponibilidade">
            <p>
              O Aliança Kingdom é um projeto mantido com dedicação e recursos limitados. Trabalhamos para
              manter tudo no ar e seguro, mas não podemos garantir disponibilidade ininterrupta. A
              plataforma é fornecida "como está", e podemos adicionar, alterar ou descontinuar
              funcionalidades a qualquer momento.
            </p>
            <p>
              Conteúdos publicados por membros (testemunhos, comentários, pedidos) expressam a opinião de
              seus autores, não da administração da plataforma.
            </p>
          </Section>

          <Section icon={<UserX className="h-4 w-4" />} title="Encerramento de conta">
            <p>
              Você pode excluir sua conta a qualquer momento — basta solicitar pelo e-mail de contato, e
              seus dados serão removidos conforme a nossa{" "}
              <Link to="/privacidade" className="text-primary hover:underline">Política de Privacidade</Link>.
              Podemos encerrar contas que violem gravemente estes termos.
            </p>
          </Section>

          <Section icon={<Mail className="h-4 w-4" />} title="Contato e alterações">
            <p>
              Dúvidas sobre estes termos:{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">{CONTACT_EMAIL}</a>.
              Se os termos mudarem de forma relevante, avisaremos na plataforma e atualizaremos a data no
              topo desta página. Estes termos são regidos pelas leis do Brasil.
            </p>
          </Section>

          <p className="text-sm text-muted-foreground text-center pt-2 border-t border-border/50">
            Veja também a nossa{" "}
            <Link to="/privacidade" className="text-primary hover:underline">Política de Privacidade</Link>.
          </p>
        </CardContent>
      </Card>
    </main>
  </div>
);

export default TermsOfService;
