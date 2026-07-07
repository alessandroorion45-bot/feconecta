import { useState } from "react";
import Header from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Book, BookOpen, Sparkles, MessageCircle, Star } from "lucide-react";

type FavoriteItem = { id: number; title: string; subtitle: string; type: string };

const mockFavorites: Record<string, FavoriteItem[]> = {
  versiculos: [
    { id: 1, title: "João 3:16", subtitle: "Porque Deus amou o mundo de tal maneira...", type: "versículo" },
    { id: 2, title: "Salmos 23:1", subtitle: "O Senhor é o meu pastor; de nada terei falta.", type: "versículo" },
    { id: 3, title: "Filipenses 4:13", subtitle: "Tudo posso naquele que me fortalece.", type: "versículo" },
  ],
  estudos: [
    { id: 4, title: "O Sermão do Monte", subtitle: "Pr. André Valadão • Vídeo • 45 min", type: "estudo" },
    { id: 5, title: "Oração Eficaz", subtitle: "Pr. Cláudio Duarte • Áudio • 30 min", type: "estudo" },
  ],
  devocionais: [
    { id: 8, title: "Devocional - João 3:16", subtitle: "16 de Março, 2026 • Amor", type: "devocional" },
  ],
  perguntas: [
    { id: 9, title: "O que significa justificação pela fé?", subtitle: "2 respostas • 12 curtidas", type: "pergunta" },
  ],
};

const tabConfig = [
  { value: "versiculos", label: "Versículos", icon: Book },
  { value: "estudos", label: "Estudos", icon: BookOpen },
  { value: "devocionais", label: "Devocionais", icon: Sparkles },
  { value: "perguntas", label: "Perguntas", icon: MessageCircle },
];

const FavoritesHub = () => {
  return (
    <div className="min-h-screen bg-gradient-hero">
      <Header />
      <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-divine bg-clip-text text-transparent mb-2">Meus Favoritos</h1>
          <p className="text-muted-foreground">Tudo que você salvou em um só lugar</p>
        </div>

        <Tabs defaultValue="versiculos">
          <TabsList className="w-full flex-wrap h-auto gap-1 mb-6">
            {tabConfig.map(tab => (
              <TabsTrigger key={tab.value} value={tab.value} className="gap-1 text-xs sm:text-sm">
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {tabConfig.map(tab => (
            <TabsContent key={tab.value} value={tab.value}>
              <div className="grid gap-3">
                {mockFavorites[tab.value]?.map(item => (
                  <Card key={item.id} className="hover:shadow-divine transition-shadow">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center shrink-0">
                        <tab.icon className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold">{item.title}</p>
                        <p className="text-sm text-muted-foreground truncate">{item.subtitle}</p>
                      </div>
                      <Heart className="h-5 w-5 text-red-500 fill-red-500 shrink-0" />
                    </CardContent>
                  </Card>
                ))}
                {(!mockFavorites[tab.value] || mockFavorites[tab.value].length === 0) && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Star className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhum favorito nesta categoria.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </main>
    </div>
  );
};

export default FavoritesHub;
