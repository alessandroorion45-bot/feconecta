import { useState } from 'react';
import Header from '@/components/Header';
import DarkModeToggle from '@/components/DarkModeToggle';
import { SharedReadingLobby } from '@/components/shared-reading/SharedReadingLobby';
import { SharedReadingRoom } from '@/components/shared-reading/SharedReadingRoom';
import { SharedReadingRanking } from '@/components/shared-reading/SharedReadingRanking';
import { Helmet } from 'react-helmet-async';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Trophy } from 'lucide-react';

const SharedReading = () => {
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);

  return (
    <>
      <Helmet>
        <title>Leitura Compartilhada | Comunidade Cristã</title>
        <meta 
          name="description" 
          content="Leia a Bíblia em grupo com amigos, responda quiz interativo e avance juntos na jornada espiritual." 
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <DarkModeToggle />

        <main className="container mx-auto px-4 py-8">
          {currentRoomId ? (
            <SharedReadingRoom 
              roomId={currentRoomId} 
              onLeave={() => setCurrentRoomId(null)} 
            />
          ) : (
            <Tabs defaultValue="lobby" className="max-w-4xl mx-auto">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="lobby" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Salas de Leitura
                </TabsTrigger>
                <TabsTrigger value="ranking" className="flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  Ranking & Medalhas
                </TabsTrigger>
              </TabsList>

              <TabsContent value="lobby">
                <SharedReadingLobby 
                  onJoinRoom={(roomId) => setCurrentRoomId(roomId)} 
                />
              </TabsContent>

              <TabsContent value="ranking">
                <SharedReadingRanking />
              </TabsContent>
            </Tabs>
          )}
        </main>
      </div>
    </>
  );
};

export default SharedReading;
