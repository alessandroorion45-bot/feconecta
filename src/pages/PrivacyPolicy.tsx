import Header from "@/components/Header";
import SEO from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { ShieldCheck, Database, Share2, UserCheck, Cookie, Lock, Mail, Baby } from "lucide-react";

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

const PrivacyPolicy = () => (
  <div className="min-h-screen bg-background">
    <SEO
      path="/privacidade"
      title="Política de Privacidade"
      description="Como o Aliança Kingdom coleta, usa e protege os dados dos membros da comunidade, em conformidade com a LGPD."
    />
    <Header />
    <main className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Política de Privacidade</h1>
        <p className="text-sm text-muted-foreground">Última atualização: {LAST_UPDATE}</p>
      </div>

      <Card className="rounded-2xl border-border/60 bg-card/60 backdrop-blur-sm">
        <CardContent className="p-6 sm:p-8 space-y-8">
          <p className="text-[15px] leading-7 text-foreground/85">
            O <strong>Aliança Kingdom</strong> (aliancakingdom.com.br) é uma comunidade cristã online.
            Levamos a sério o cuidado com os seus dados — este documento explica, em linguagem simples,
            o que coletamos, por que coletamos e quais são os seus direitos, em conformidade com a
            Lei Geral de Proteção de Dados (LGPD, Lei nº 13.709/2018).
          </p>

          <Section icon={<Database className="h-4 w-4" />} title="Quais dados coletamos">
            <p>
              <strong>Dados de cadastro:</strong> nome, e-mail, nome de usuário e, se você entrar com o
              Google, a foto de perfil e o e-mail fornecidos pela sua conta Google. Nunca temos acesso à
              sua senha do Google.
            </p>
            <p>
              <strong>Dados de perfil (opcionais):</strong> cidade, igreja/comunidade, ministérios,
              estado civil, biografia e foto de capa — você escolhe o que preencher.
            </p>
            <p>
              <strong>Conteúdo que você cria:</strong> publicações, comentários, testemunhos, pedidos de
              oração, fotos, vídeos, mensagens e progresso em estudos bíblicos e gamificação.
            </p>
            <p>
              <strong>Doações e compras de apoio:</strong> o pagamento é processado inteiramente pelo{" "}
              <strong>Mercado Pago</strong> — não armazenamos dados de cartão. Guardamos apenas o
              registro da contribuição (valor, data e status) para transparência e entrega dos itens.
            </p>
          </Section>

          <Section icon={<ShieldCheck className="h-4 w-4" />} title="Para que usamos os dados">
            <p>
              Exclusivamente para o funcionamento da plataforma: manter seu perfil, exibir seu conteúdo à
              comunidade, calcular conquistas e selos, processar doações e melhorar a experiência.
              <strong> Não vendemos nem alugamos seus dados a terceiros. Não usamos seus dados para
              publicidade.</strong>
            </p>
          </Section>

          <Section icon={<Share2 className="h-4 w-4" />} title="Com quem os dados são compartilhados">
            <p>Apenas com os serviços essenciais que fazem a plataforma funcionar:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Supabase</strong> — banco de dados e autenticação (armazenamento seguro);</li>
              <li><strong>Vercel</strong> — hospedagem do site;</li>
              <li><strong>Google</strong> — somente quando você escolhe "Entrar com Google";</li>
              <li><strong>Mercado Pago</strong> — somente quando você faz uma doação ou compra de apoio;</li>
              <li><strong>ImageKit</strong> — armazenamento e otimização de imagens enviadas por você.</li>
            </ul>
            <p>
              Conteúdos que você publica (posts, testemunhos, comentários) ficam visíveis aos demais
              membros conforme as configurações de privacidade do seu perfil.
            </p>
          </Section>

          <Section icon={<Lock className="h-4 w-4" />} title="Como protegemos os dados">
            <p>
              Usamos conexão criptografada (HTTPS) em todo o site, controle de acesso por linha no banco
              de dados (cada usuário só acessa o que lhe pertence), e as chaves de acesso sensíveis ficam
              guardadas apenas no servidor. Senhas de cadastro são armazenadas com criptografia
              irreversível.
            </p>
          </Section>

          <Section icon={<UserCheck className="h-4 w-4" />} title="Seus direitos (LGPD)">
            <p>Você pode, a qualquer momento:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Acessar e corrigir seus dados (pela própria página de perfil);</li>
              <li>Solicitar a exclusão da sua conta e de todos os dados associados;</li>
              <li>Solicitar uma cópia dos dados que temos sobre você;</li>
              <li>Revogar o acesso da sua conta Google nas configurações da sua Conta Google.</li>
            </ul>
            <p>
              Para exercer qualquer um desses direitos, escreva para{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">{CONTACT_EMAIL}</a>{" "}
              — respondemos o mais rápido possível.
            </p>
          </Section>

          <Section icon={<Cookie className="h-4 w-4" />} title="Cookies e armazenamento local">
            <p>
              Usamos apenas o armazenamento essencial para manter você conectado entre visitas (sessão de
              login) e lembrar preferências como idioma e tema. Não usamos cookies de rastreamento ou de
              publicidade.
            </p>
          </Section>

          <Section icon={<Baby className="h-4 w-4" />} title="Crianças e adolescentes">
            <p>
              A plataforma é destinada a maiores de 13 anos. Menores de 18 devem utilizar com
              consentimento dos responsáveis.
            </p>
          </Section>

          <Section icon={<Mail className="h-4 w-4" />} title="Contato e mudanças nesta política">
            <p>
              Dúvidas sobre privacidade: {" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">{CONTACT_EMAIL}</a>.
              Se esta política mudar de forma relevante, avisaremos na plataforma e atualizaremos a data
              no topo desta página.
            </p>
          </Section>

          <p className="text-sm text-muted-foreground text-center pt-2 border-t border-border/50">
            Veja também os nossos{" "}
            <Link to="/termos" className="text-primary hover:underline">Termos de Serviço</Link>.
          </p>
        </CardContent>
      </Card>
    </main>
  </div>
);

export default PrivacyPolicy;
