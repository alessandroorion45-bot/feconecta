import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Key, Globe, BookOpen, Sparkles } from 'lucide-react';
import { useSharedReading, Room } from '@/hooks/useSharedReading';
import { bibleApi, BibleBook } from '@/services/bibleApi';
import { motion, AnimatePresence } from 'framer-motion';

interface SharedReadingLobbyProps {
  onJoinRoom: (roomId: string) => void;
}

export const SharedReadingLobby = ({ onJoinRoom }: SharedReadingLobbyProps) => {
  const { createRoom, joinRoomByCode, getPublicRooms, currentUserId } = useSharedReading();
  const [books, setBooks] = useState<BibleBook[]>([]);
  const [publicRooms, setPublicRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Create room form
  const [roomName, setRoomName] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [selectedBook, setSelectedBook] = useState('gn');
  const [selectedChapter, setSelectedChapter] = useState(1);

  // Join room form
  const [roomCode, setRoomCode] = useState('');

  useEffect(() => {
    const loadData = async () => {
      const booksData = await bibleApi.getBooks();
      setBooks(booksData);
      
      const rooms = await getPublicRooms();
      setPublicRooms(rooms);
    };
    loadData();
  }, []);

  const selectedBookData = books.find(b => b.abrev === selectedBook);
  const chapters = selectedBookData ? Array.from({ length: selectedBookData.chapters }, (_, i) => i + 1) : [];

  const handleCreateRoom = async () => {
    if (!roomName.trim()) return;
    setLoading(true);
    const room = await createRoom(roomName, isPublic, selectedBook, selectedChapter);
    setLoading(false);
    if (room) {
      onJoinRoom(room.id);
    }
  };

  const handleJoinByCode = async () => {
    if (!roomCode.trim()) return;
    setLoading(true);
    const room = await joinRoomByCode(roomCode);
    setLoading(false);
    if (room) {
      onJoinRoom(room.id);
    }
  };

  const handleJoinPublicRoom = async (room: any) => {
    setLoading(true);
    const joined = await joinRoomByCode(room.room_code);
    setLoading(false);
    if (joined) {
      onJoinRoom(room.id);
    }
  };

  if (!currentUserId) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            Leitura Compartilhada
          </CardTitle>
          <CardDescription>
            Faça login para participar de sessões de leitura em grupo
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      {/* Header */}
      <Card className="bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10 border-primary/20">
        <CardHeader className="text-center pb-4">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <CardTitle className="text-2xl flex items-center justify-center gap-3">
              <Sparkles className="h-7 w-7 text-primary animate-pulse" />
              Leitura Bíblica Compartilhada
              <Sparkles className="h-7 w-7 text-primary animate-pulse" />
            </CardTitle>
          </motion.div>
          <CardDescription className="text-base">
            Leia a Bíblia em grupo, responda quiz e avance juntos na jornada espiritual!
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="create" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="create" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Criar Sala
          </TabsTrigger>
          <TabsTrigger value="join" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            Entrar com Código
          </TabsTrigger>
          <TabsTrigger value="public" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Salas Públicas
          </TabsTrigger>
        </TabsList>

        {/* Create Room Tab */}
        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Criar Nova Sala</CardTitle>
              <CardDescription>
                Configure sua sessão de leitura e convide amigos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="roomName">Nome da Sala</Label>
                <Input
                  id="roomName"
                  placeholder="Ex: Estudo de Gênesis"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Livro</Label>
                <Select value={selectedBook} onValueChange={setSelectedBook}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o livro" />
                    </SelectTrigger>
                    <SelectContent>
                      {books.map(book => (
                        <SelectItem key={book.abrev} value={book.abrev}>
                          {book.names[0]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Capítulo</Label>
                  <Select 
                    value={selectedChapter.toString()} 
                    onValueChange={(v) => setSelectedChapter(parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Capítulo" />
                    </SelectTrigger>
                    <SelectContent>
                      {chapters.map(ch => (
                        <SelectItem key={ch} value={ch.toString()}>
                          Capítulo {ch}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div className="space-y-0.5">
                  <Label htmlFor="public-switch">Sala Pública</Label>
                  <p className="text-sm text-muted-foreground">
                    {isPublic ? 'Qualquer pessoa pode entrar' : 'Apenas com código de convite'}
                  </p>
                </div>
                <Switch
                  id="public-switch"
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                />
              </div>

              <Button 
                className="w-full" 
                size="lg"
                onClick={handleCreateRoom}
                disabled={loading || !roomName.trim()}
              >
                <Plus className="h-5 w-5 mr-2" />
                Criar Sala
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Join by Code Tab */}
        <TabsContent value="join">
          <Card>
            <CardHeader>
              <CardTitle>Entrar com Código</CardTitle>
              <CardDescription>
                Digite o código de 6 caracteres compartilhado pelo anfitrião
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="roomCode">Código da Sala</Label>
                <Input
                  id="roomCode"
                  placeholder="Ex: ABC123"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="text-center text-2xl font-mono tracking-widest"
                />
              </div>

              <Button 
                className="w-full" 
                size="lg"
                onClick={handleJoinByCode}
                disabled={loading || roomCode.length !== 6}
              >
                <Key className="h-5 w-5 mr-2" />
                Entrar na Sala
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Public Rooms Tab */}
        <TabsContent value="public">
          <Card>
            <CardHeader>
              <CardTitle>Salas Públicas Disponíveis</CardTitle>
              <CardDescription>
                Entre em uma sala aberta e comece a ler agora
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                {publicRooms.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-8 text-muted-foreground"
                  >
                    <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma sala pública disponível no momento</p>
                    <p className="text-sm">Crie uma nova sala para começar!</p>
                  </motion.div>
                ) : (
                  <div className="space-y-3">
                    {publicRooms.map((room, index) => (
                      <motion.div
                        key={room.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium">{room.room_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {room.current_book_abbrev.toUpperCase()} {room.current_chapter}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {room.participant_count?.[0]?.count || 1}/7
                          </Badge>
                          <Button 
                            size="sm"
                            onClick={() => handleJoinPublicRoom(room)}
                            disabled={loading}
                          >
                            Entrar
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};
