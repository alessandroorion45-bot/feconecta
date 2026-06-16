import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Heart, Sparkles, DollarSign, HeartPulse, Shield, Play, CheckCircle, BookOpen, Flame } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Campaign {
  id: string;
  campaign_type: string;
  duration_days: number;
  current_day: number;
  started_at: string;
  completed_at: string | null;
  is_active: boolean;
}

interface DayReading {
  day: number;
  book: string;
  bookAbbrev: string;
  chapter: number;
  keyVerse: string;
  keyVerseRef: string;
}

interface CampaignType {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  description: string;
  readings: DayReading[];
  prayerFocus: string;
}

const CAMPAIGN_TYPES: CampaignType[] = [
  {
    id: 'sentimental',
    name: 'Vida Sentimental',
    icon: Heart,
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10',
    description: 'Fortaleça seus relacionamentos e encontre amor verdadeiro através da Palavra.',
    prayerFocus: 'Senhor, abençoe meus relacionamentos e me ensine a amar como Tu amas.',
    readings: [
      { day: 1, book: '1 Coríntios', bookAbbrev: '1co', chapter: 13, keyVerse: 'O amor é paciente, é benigno...', keyVerseRef: '1 Co 13:4' },
      { day: 2, book: 'Cantares', bookAbbrev: 'ct', chapter: 2, keyVerse: 'Eu sou do meu amado, e o meu amado é meu...', keyVerseRef: 'Ct 2:16' },
      { day: 3, book: 'Efésios', bookAbbrev: 'ef', chapter: 5, keyVerse: 'Maridos, amai vossa mulher, como Cristo amou a igreja...', keyVerseRef: 'Ef 5:25' },
      { day: 4, book: 'Colossenses', bookAbbrev: 'cl', chapter: 3, keyVerse: 'Revesti-vos do amor, que é o vínculo da perfeição.', keyVerseRef: 'Cl 3:14' },
      { day: 5, book: 'Provérbios', bookAbbrev: 'pv', chapter: 31, keyVerse: 'Mulher virtuosa, quem a achará?', keyVerseRef: 'Pv 31:10' },
      { day: 6, book: 'Gênesis', bookAbbrev: 'gn', chapter: 2, keyVerse: 'Deixa o homem pai e mãe e se une à sua mulher...', keyVerseRef: 'Gn 2:24' },
      { day: 7, book: 'Salmos', bookAbbrev: 'sl', chapter: 37, keyVerse: 'Descansa no Senhor e espera nele...', keyVerseRef: 'Sl 37:7' },
    ],
  },
  {
    id: 'spiritual',
    name: 'Vida Espiritual',
    icon: Sparkles,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    description: 'Aprofunde sua comunhão com Deus e fortaleça sua fé.',
    prayerFocus: 'Senhor, fortalece minha fé e me aproxima cada vez mais de Ti.',
    readings: [
      { day: 1, book: 'Efésios', bookAbbrev: 'ef', chapter: 6, keyVerse: 'Revesti-vos de toda a armadura de Deus...', keyVerseRef: 'Ef 6:11' },
      { day: 2, book: 'Romanos', bookAbbrev: 'rm', chapter: 12, keyVerse: 'Transformai-vos pela renovação da vossa mente...', keyVerseRef: 'Rm 12:2' },
      { day: 3, book: 'João', bookAbbrev: 'jo', chapter: 15, keyVerse: 'Eu sou a videira, vós sois os ramos...', keyVerseRef: 'Jo 15:5' },
      { day: 4, book: 'Hebreus', bookAbbrev: 'hb', chapter: 11, keyVerse: 'A fé é a certeza das coisas que se esperam...', keyVerseRef: 'Hb 11:1' },
      { day: 5, book: 'Tiago', bookAbbrev: 'tg', chapter: 1, keyVerse: 'Mas sede cumpridores da palavra...', keyVerseRef: 'Tg 1:22' },
      { day: 6, book: 'Mateus', bookAbbrev: 'mt', chapter: 6, keyVerse: 'Buscai primeiro o Reino de Deus...', keyVerseRef: 'Mt 6:33' },
      { day: 7, book: 'Salmos', bookAbbrev: 'sl', chapter: 119, keyVerse: 'Lâmpada para os meus pés é a tua palavra...', keyVerseRef: 'Sl 119:105' },
    ],
  },
  {
    id: 'financial',
    name: 'Vida Financeira',
    icon: DollarSign,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    description: 'Busque prosperidade e sabedoria na administração dos seus recursos.',
    prayerFocus: 'Senhor, me ensina a administrar com sabedoria e confiar na Tua provisão.',
    readings: [
      { day: 1, book: 'Filipenses', bookAbbrev: 'fp', chapter: 4, keyVerse: 'O meu Deus suprirá todas as vossas necessidades...', keyVerseRef: 'Fp 4:19' },
      { day: 2, book: 'Provérbios', bookAbbrev: 'pv', chapter: 3, keyVerse: 'Honra ao Senhor com os teus bens...', keyVerseRef: 'Pv 3:9' },
      { day: 3, book: 'Mateus', bookAbbrev: 'mt', chapter: 25, keyVerse: 'Sobre o pouco foste fiel, sobre o muito te colocarei...', keyVerseRef: 'Mt 25:21' },
      { day: 4, book: '2 Coríntios', bookAbbrev: '2co', chapter: 9, keyVerse: 'Deus ama ao que dá com alegria.', keyVerseRef: '2 Co 9:7' },
      { day: 5, book: 'Malaquias', bookAbbrev: 'ml', chapter: 3, keyVerse: 'Trazei todos os dízimos à casa do Tesouro...', keyVerseRef: 'Ml 3:10' },
      { day: 6, book: 'Lucas', bookAbbrev: 'lc', chapter: 12, keyVerse: 'A vida não consiste na abundância de bens...', keyVerseRef: 'Lc 12:15' },
      { day: 7, book: 'Deuteronômio', bookAbbrev: 'dt', chapter: 28, keyVerse: 'O Senhor te abrirá o seu bom tesouro...', keyVerseRef: 'Dt 28:12' },
    ],
  },
  {
    id: 'health',
    name: 'Saúde',
    icon: HeartPulse,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    description: 'Clame por cura e proteção divina para seu corpo e mente.',
    prayerFocus: 'Senhor, restaura minha saúde e me dá força para cada dia.',
    readings: [
      { day: 1, book: 'Jeremias', bookAbbrev: 'jr', chapter: 30, keyVerse: 'Porque te restaurarei a saúde e te curarei...', keyVerseRef: 'Jr 30:17' },
      { day: 2, book: 'Isaías', bookAbbrev: 'is', chapter: 53, keyVerse: 'Pelas suas pisaduras fomos sarados.', keyVerseRef: 'Is 53:5' },
      { day: 3, book: 'Salmos', bookAbbrev: 'sl', chapter: 103, keyVerse: 'Ele é quem sara todas as tuas enfermidades...', keyVerseRef: 'Sl 103:3' },
      { day: 4, book: 'Mateus', bookAbbrev: 'mt', chapter: 9, keyVerse: 'Jesus curava toda sorte de doenças...', keyVerseRef: 'Mt 9:35' },
      { day: 5, book: 'Marcos', bookAbbrev: 'mc', chapter: 5, keyVerse: 'Tua fé te salvou; vai-te em paz...', keyVerseRef: 'Mc 5:34' },
      { day: 6, book: 'Tiago', bookAbbrev: 'tg', chapter: 5, keyVerse: 'A oração da fé salvará o doente...', keyVerseRef: 'Tg 5:15' },
      { day: 7, book: 'Apocalipse', bookAbbrev: 'ap', chapter: 21, keyVerse: 'E Deus limpará de seus olhos toda lágrima...', keyVerseRef: 'Ap 21:4' },
    ],
  },
  {
    id: 'protection',
    name: 'Proteção contra Inveja',
    icon: Shield,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    description: 'Busque proteção divina contra olho grande, inveja e maldade.',
    prayerFocus: 'Senhor, me protege de todo mal e cobre minha vida com Teu manto.',
    readings: [
      { day: 1, book: 'Salmos', bookAbbrev: 'sl', chapter: 91, keyVerse: 'Aquele que habita no esconderijo do Altíssimo...', keyVerseRef: 'Sl 91:1' },
      { day: 2, book: 'Salmos', bookAbbrev: 'sl', chapter: 23, keyVerse: 'O Senhor é o meu pastor; de nada terei falta.', keyVerseRef: 'Sl 23:1' },
      { day: 3, book: 'Isaías', bookAbbrev: 'is', chapter: 41, keyVerse: 'Não temas, porque eu sou contigo...', keyVerseRef: 'Is 41:10' },
      { day: 4, book: 'Provérbios', bookAbbrev: 'pv', chapter: 24, keyVerse: 'Não invejes os homens malignos...', keyVerseRef: 'Pv 24:1' },
      { day: 5, book: 'Romanos', bookAbbrev: 'rm', chapter: 8, keyVerse: 'Se Deus é por nós, quem será contra nós?', keyVerseRef: 'Rm 8:31' },
      { day: 6, book: 'Salmos', bookAbbrev: 'sl', chapter: 27, keyVerse: 'O Senhor é a minha luz e a minha salvação...', keyVerseRef: 'Sl 27:1' },
      { day: 7, book: '2 Tessalonicenses', bookAbbrev: '2ts', chapter: 3, keyVerse: 'Mas o Senhor é fiel, o qual vos guardará do maligno.', keyVerseRef: '2 Ts 3:3' },
    ],
  },
];

const DURATION_OPTIONS = [
  { value: 7, label: '7 dias' },
  { value: 21, label: '21 dias (3 ciclos)' },
  { value: 40, label: '40 dias (transformação)' },
];

interface SpiritualCampaignsEnhancedProps {
  onNavigateToPassage?: (bookAbbrev: string, chapter: number) => void;
}

const SpiritualCampaignsEnhanced = ({ onNavigateToPassage }: SpiritualCampaignsEnhancedProps) => {
  const { toast } = useToast();
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedDuration, setSelectedDuration] = useState<number>(7);
  const [showPrayerDialog, setShowPrayerDialog] = useState(false);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);

  useEffect(() => {
    loadActiveCampaign();
  }, []);

  const loadActiveCampaign = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('spiritual_campaigns')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (data) {
      setActiveCampaign(data);
    }
  };

  const startCampaign = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Faça login",
        description: "Você precisa estar logado para iniciar uma campanha.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedType) {
      toast({
        title: "Selecione uma área",
        description: "Escolha uma área de foco para sua campanha.",
        variant: "destructive",
      });
      return;
    }

    await supabase
      .from('spiritual_campaigns')
      .update({ is_active: false })
      .eq('user_id', user.id)
      .eq('is_active', true);

    const { data, error } = await supabase
      .from('spiritual_campaigns')
      .insert({
        user_id: user.id,
        campaign_type: selectedType,
        duration_days: selectedDuration,
        current_day: 1,
      })
      .select()
      .single();

    if (data && !error) {
      setActiveCampaign(data);
      setIsDialogOpen(false);
      toast({
        title: "Campanha iniciada! 🙏",
        description: `Sua jornada de ${selectedDuration} dias começou. Que Deus abençoe!`,
      });
    }
  };

  const markDayComplete = async () => {
    if (!activeCampaign) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const newDay = activeCampaign.current_day + 1;
    const isCompleted = newDay > activeCampaign.duration_days;

    await supabase
      .from('campaign_daily_progress')
      .insert({
        campaign_id: activeCampaign.id,
        user_id: user.id,
        day_number: activeCampaign.current_day,
        prayed: true,
      });

    await supabase
      .from('spiritual_campaigns')
      .update({
        current_day: isCompleted ? activeCampaign.duration_days : newDay,
        is_active: !isCompleted,
        completed_at: isCompleted ? new Date().toISOString() : null,
      })
      .eq('id', activeCampaign.id);

    if (isCompleted) {
      setShowCompletionDialog(true);
      setActiveCampaign(null);
    } else {
      setActiveCampaign({ ...activeCampaign, current_day: newDay });
      toast({
        title: "Dia completado! ✨",
        description: `Você está no dia ${newDay} de ${activeCampaign.duration_days}. Continue firme!`,
      });
    }

    setShowPrayerDialog(false);
  };

  const getCampaignType = (typeId: string): CampaignType | undefined => {
    return CAMPAIGN_TYPES.find(t => t.id === typeId);
  };

  const getCurrentDayReading = (): DayReading | null => {
    if (!activeCampaign) return null;
    const campaignType = getCampaignType(activeCampaign.campaign_type);
    if (!campaignType) return null;
    const readingIndex = (activeCampaign.current_day - 1) % campaignType.readings.length;
    return campaignType.readings[readingIndex];
  };

  const progress = activeCampaign
    ? ((activeCampaign.current_day - 1) / activeCampaign.duration_days) * 100
    : 0;

  const currentReading = getCurrentDayReading();
  const currentCampaignType = activeCampaign ? getCampaignType(activeCampaign.campaign_type) : null;

  return (
    <>
      <Card className="shadow-divine overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-primary" />
            Campanhas Espirituais
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {activeCampaign && currentCampaignType ? (
            <div className="space-y-5">
              {/* Campaign Header */}
              <div className={`flex items-center gap-4 p-4 rounded-xl ${currentCampaignType.bgColor}`}>
                <div className={`p-3 rounded-full bg-background ${currentCampaignType.color}`}>
                  <currentCampaignType.icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{currentCampaignType.name}</h3>
                  <p className="text-sm text-muted-foreground">{currentCampaignType.description}</p>
                </div>
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  {activeCampaign.current_day}/{activeCampaign.duration_days}
                </Badge>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progresso</span>
                  <span className="font-medium">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-3" />
              </div>

              {/* Today's Reading */}
              {currentReading && (
                <div className="bg-muted/50 rounded-xl p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <h4 className="font-semibold">Leitura do Dia {activeCampaign.current_day}</h4>
                  </div>
                  
                  <div className="bg-background rounded-lg p-4 border">
                    <p className="text-xl font-bold text-primary mb-1">
                      {currentReading.book} {currentReading.chapter}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Capítulo completo
                    </p>
                  </div>

                  <div className="bg-primary/5 rounded-lg p-4 border-l-4 border-primary">
                    <p className="text-xs text-muted-foreground mb-1">Versículo-chave:</p>
                    <p className="italic text-sm">"{currentReading.keyVerse}"</p>
                    <p className="text-xs text-primary mt-1 font-medium">{currentReading.keyVerseRef}</p>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      className="flex-1"
                      onClick={() => {
                        if (onNavigateToPassage) {
                          onNavigateToPassage(currentReading.bookAbbrev, currentReading.chapter);
                        }
                      }}
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      Ler Capítulo
                    </Button>
                    <Button
                      variant="secondary"
                      className="flex-1"
                      onClick={() => setShowPrayerDialog(true)}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Completar Dia
                    </Button>
                  </div>

                  {/* Option to start a new campaign */}
                  <div className="pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setIsDialogOpen(true)}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Iniciar Nova Campanha
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center space-y-6 py-4">
              <div className="space-y-2">
                <Flame className="h-12 w-12 mx-auto text-primary/50" />
                <p className="text-muted-foreground">
                  Inicie uma campanha espiritual e transforme sua vida através da Palavra de Deus.
                </p>
              </div>
              <Button className="gap-2" size="lg" onClick={() => setIsDialogOpen(true)}>
                <Play className="h-5 w-5" />
                Iniciar Campanha
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Campaign Dialog - Available from both states */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Campanha Espiritual</DialogTitle>
            <DialogDescription>
              Escolha uma área de foco e a duração da sua jornada de fé.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <label className="text-sm font-medium">Área de foco</label>
              <div className="grid grid-cols-1 gap-3">
                {CAMPAIGN_TYPES.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.id}
                      onClick={() => setSelectedType(type.id)}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                        selectedType === type.id
                          ? `border-primary ${type.bgColor}`
                          : 'border-border hover:border-primary/50 hover:bg-muted/50'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${type.bgColor}`}>
                        <Icon className={`h-6 w-6 ${type.color}`} />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{type.name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{type.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">Duração da Jornada</label>
              <Select
                value={selectedDuration.toString()}
                onValueChange={(v) => setSelectedDuration(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                As leituras se repetem em ciclos para campanhas maiores.
              </p>
            </div>

            <Button onClick={startCampaign} className="w-full" size="lg">
              Começar Jornada 🙏
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Prayer Dialog */}
      <Dialog open={showPrayerDialog} onOpenChange={setShowPrayerDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              🙏 Momento de Oração
            </DialogTitle>
            <DialogDescription>
              Você completou a leitura do dia. Agora, faça uma oração sincera e com fé.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-5">
            {currentReading && (
              <div className="bg-primary/10 p-4 rounded-xl">
                <p className="font-bold text-primary text-lg">{currentReading.book} {currentReading.chapter}</p>
                <p className="text-sm italic mt-2">"{currentReading.keyVerse}"</p>
                <p className="text-xs text-primary mt-1">{currentReading.keyVerseRef}</p>
              </div>
            )}

            <div className="bg-muted rounded-xl p-4 space-y-3">
              <p className="text-sm font-medium flex items-center gap-2">
                💡 Foco da sua oração:
              </p>
              <p className="text-sm italic text-muted-foreground">
                "{currentCampaignType?.prayerFocus}"
              </p>
            </div>

            <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-4 border border-primary/20">
              <p className="text-sm font-medium mb-2">Sugestão de oração:</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                "Senhor Deus, agradeço pela Tua Palavra que transforma minha vida. 
                Aplica em mim o que li hoje em {currentReading?.book} {currentReading?.chapter}. 
                Fortalece minha fé e guia meus passos. 
                Em nome de Jesus, amém."
              </p>
            </div>

            <Button onClick={markDayComplete} className="w-full" size="lg">
              <CheckCircle className="h-5 w-5 mr-2" />
              Li o capítulo e fiz minha oração
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Completion Dialog */}
      <Dialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
        <DialogContent className="text-center">
          <DialogHeader>
            <DialogTitle className="text-2xl">🎉 Parabéns!</DialogTitle>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <div className="text-6xl">🏆</div>
            <p className="text-lg font-medium">
              Você completou sua campanha espiritual!
            </p>
            <p className="text-muted-foreground">
              Que as bênçãos de Deus estejam sobre você. Continue firme na fé e na leitura da Palavra.
            </p>
            <div className="bg-primary/10 p-4 rounded-xl">
              <p className="text-sm italic">
                "Bem-aventurado o homem que não anda segundo o conselho dos ímpios... 
                mas tem o seu prazer na lei do Senhor."
              </p>
              <p className="text-xs text-primary mt-1">Salmos 1:1-2</p>
            </div>
          </div>
          <Button onClick={() => setShowCompletionDialog(false)} className="w-full">
            Continuar
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SpiritualCampaignsEnhanced;
