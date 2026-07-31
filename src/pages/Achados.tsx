import { useEffect, useState } from "react";
import Header from "@/components/Header";
import SEO from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { TiltCard, AFFILIATE_SELECT, type AffiliateProduct } from "@/components/affiliate/RecommendedProducts";
import { Gem, Handshake, Info, Loader2 } from "lucide-react";

export default function Achados() {
  const [products, setProducts] = useState<AffiliateProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("affiliate_products")
      .select(AFFILIATE_SELECT)
      .eq("status", "active")
      .order("ordem", { ascending: true })
      .then(({ data }) => {
        setProducts((data as AffiliateProduct[]) || []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        path="/achados"
        title="Achados da Aliança"
        description="Boas descobertas de parceiros, escolhidas com carinho pela Aliança Kingdom. Ao comprar por esses links de parceiro, você ajuda a manter o app — sem custo adicional."
      />
      <Header />

      <main className="container max-w-6xl mx-auto py-6 px-4 pb-16">
        {/* Hero */}
        <div className="text-center pt-4 pb-8">
          <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-amber-500 to-fuchsia-600 rounded-full mb-4 shadow-lg">
            <Gem className="h-9 w-9 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-amber-500 to-fuchsia-600 bg-clip-text text-transparent leading-tight pb-1">
            Achados da Aliança
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto mt-3 leading-relaxed">
            Boas descobertas que separamos com carinho. São <strong className="text-foreground">links de parceiro</strong> —
            ao comprar por eles, você ajuda a manter o Aliança Kingdom no ar, <strong className="text-foreground">sem
            nenhum custo adicional</strong> pra você. 🕊️
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Handshake className="h-12 w-12 mx-auto mb-3 opacity-40" />
            Ainda não há achados por aqui. Volte em breve — coisas boas estão a caminho. 🙏
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {products.map((p) => (
                <TiltCard key={p.id} product={p} />
              ))}
            </div>

            {/* Rodapé de transparência (obrigatório) */}
            <p className="mt-8 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
              <Info className="h-3 w-3 shrink-0" />
              A Aliança pode receber uma comissão por compras feitas através destes links, sem nenhum custo extra para você.
            </p>
          </>
        )}
      </main>
    </div>
  );
}
