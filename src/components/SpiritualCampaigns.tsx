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
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Heart, Sparkles, DollarSign, HeartPulse, Shield, Play, CheckCircle, BookOpen } from 'lucide-react';
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

interface CampaignType {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  description: string;
  passages: { reference: string; text: string }[];
}

const CAMPAIGN_TYPES: CampaignType[] = [
  {
    id: 'sentimental',
    name: 'Vida Sentimental',
    icon: Heart,
    color: 'text-pink-500',
    description: 'Fortaleça seus relacionamentos e encontre amor verdadeiro através da Palavra.',
    passages: [
      { reference: '1 Coríntios 13:4-8', text: 'O amor é paciente, é benigno; o amor não arde em ciúmes...' },
      { reference: 'Cantares 8:7', text: 'As muitas águas não poderiam apagar o amor...' },
      { reference: 'Efésios 5:25', text: 'Maridos, amai vossa mulher, como também Cristo amou a igreja...' },
      { reference: 'Provérbios 31:10', text: 'Mulher virtuosa, quem a achará? O seu valor muito excede...' },
      { reference: 'Gênesis 2:24', text: 'Por isso, deixa o homem pai e mãe e se une à sua mulher...' },
    ],
  },
  {
    id: 'spiritual',
    name: 'Vida Espiritual',
    icon: Sparkles,
    color: 'text-purple-500',
    description: 'Aprofunde sua comunhão com Deus e fortaleça sua fé.',
    passages: [
      { reference: 'Efésios 6:10-18', text: 'Revesti-vos de toda a armadura de Deus...' },
      { reference: 'Filipenses 4:13', text: 'Posso todas as coisas naquele que me fortalece.' },
      { reference: 'Romanos 12:2', text: 'Transformai-vos pela renovação da vossa mente...' },
      { reference: 'Josué 1:8', text: 'Não se aparte da tua boca o livro desta Lei...' },
      { reference: 'Salmos 119:105', text: 'Lâmpada para os meus pés é a tua palavra...' },
    ],
  },
  {
    id: 'financial',
    name: 'Vida Financeira',
    icon: DollarSign,
    color: 'text-green-500',
    description: 'Busque prosperidade e sabedoria na administração dos seus recursos.',
    passages: [
      { reference: 'Filipenses 4:19', text: 'O meu Deus suprirá todas as vossas necessidades...' },
      { reference: 'Malaquias 3:10', text: 'Trazei todos os dízimos à casa do Tesouro...' },
      { reference: 'Provérbios 3:9-10', text: 'Honra ao Senhor com os teus bens...' },
      { reference: 'Deuteronômio 8:18', text: 'Lembra-te do Senhor, teu Deus, porque é ele que te dá força...' },
      { reference: 'Lucas 6:38', text: 'Dai, e dar-se-vos-á; boa medida, recalcada...' },
    ],
  },
  {
    id: 'health',
    name: 'Saúde',
    icon: HeartPulse,
    color: 'text-red-500',
    description: 'Clame por cura e proteção divina para seu corpo e mente.',
    passages: [
      { reference: 'Jeremias 30:17', text: 'Porque te restaurarei a saúde e te curarei as feridas...' },
      { reference: 'Isaías 53:5', text: 'Pelas suas pisaduras fomos sarados.' },
      { reference: '3 João 1:2', text: 'Amado, desejo que te vá bem em todas as coisas...' },
      { reference: 'Êxodo 23:25', text: 'Tirarei do vosso meio as enfermidades.' },
      { reference: 'Salmos 103:3', text: 'Ele é quem perdoa todas as tuas iniquidades; quem sara todas as tuas enfermidades.' },
    ],
  },
  {
    id: 'protection',
    name: 'Proteção contra Inveja',
    icon: Shield,
    color: 'text-blue-500',
    description: 'Busque proteção divina contra olho grande, inveja e maldade.',
    passages: [
      { reference: 'Salmos 91', text: 'Aquele que habita no esconderijo do Altíssimo...' },
      { reference: 'Isaías 54:17', text: 'Nenhuma arma forjada contra ti prosperará...' },
      { reference: 'Salmos 121', text: 'O Senhor é quem te guarda; o Senhor é a tua sombra...' },
      { reference: 'Provérbios 14:30', text: 'O coração em paz dá vida ao corpo, mas a inveja apodrece os ossos.' },
      { reference: 'Romanos 12:21', text: 'Não te deixes vencer pelo mal, mas vence o mal com o bem.' },
    ],
  },
];

const DURATION_OPTIONS = [
  { value: 7, label: '7 dias' },
  { value: 21, label: '21 dias' },
  { value: 40, label: '40 dias' },
];

interface SpiritualCampaignsProps {
  onNavigateToPassage?: (book: string, chapter: number) => void;
}

const SpiritualCampaigns = ({ onNavigateToPassage }: SpiritualCampaignsProps) => {
  const { toast } = useToast();
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedDuration, setSelectedDuration] = useState<number>(7);
  const [showPrayerDialog, setShowPrayerDialog] = useState(false);
  const [currentPassage, setCurrentPassage] = useState<{ reference: string; text: string } | null>(null);

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

    // Deactivate any existing campaign
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

    // Record daily progress
    await supabase
      .from('campaign_daily_progress')
      .insert({
        campaign_id: activeCampaign.id,
        user_id: user.id,
        day_number: activeCampaign.current_day,
        prayed: true,
      });

    // Update campaign
    await supabase
      .from('spiritual_campaigns')
      .update({
        current_day: isCompleted ? activeCampaign.duration_days : newDay,
        is_active: !isCompleted,
        completed_at: isCompleted ? new Date().toISOString() : null,
      })
      .eq('id', activeCampaign.id);

    if (isCompleted) {
      toast({
        title: "🎉 Campanha concluída!",
        description: "Parabéns! Você completou sua jornada espiritual. Que as bênçãos de Deus estejam sobre você!",
      });
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

  const getCurrentDayPassage = () => {
    if (!activeCampaign) return null;
    const campaignType = getCampaignType(activeCampaign.campaign_type);
    if (!campaignType) return null;
    const passageIndex = (activeCampaign.current_day - 1) % campaignType.passages.length;
    return campaignType.passages[passageIndex];
  };

  const progress = activeCampaign
    ? ((activeCampaign.current_day - 1) / activeCampaign.duration_days) * 100
    : 0;

  return (
    <>
      <Card className="shadow-divine">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Campanhas Espirituais
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeCampaign ? (
            <div className="space-y-4">
              {(() => {
                const campaignType = getCampaignType(activeCampaign.campaign_type);
                const Icon = campaignType?.icon || Sparkles;
                return (
                  <>
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-full bg-muted ${campaignType?.color}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{campaignType?.name}</h3>
                        <Badge variant="outline">
                          Dia {activeCampaign.current_day} de {activeCampaign.duration_days}
                        </Badge>
                      </div>
                    </div>

                    <Progress value={progress} className="h-2" />

                    <div className="bg-muted/50 p-4 rounded-lg">
                      <p className="text-sm font-medium mb-2">📖 Leitura do dia:</p>
                      <p className="text-sm font-semibold text-primary">
                        {getCurrentDayPassage()?.reference}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1 italic">
                        "{getCurrentDayPassage()?.text}"
                      </p>
                    </div>

                    <Button
                      className="w-full"
                      onClick={() => {
                        setCurrentPassage(getCurrentDayPassage());
                        setShowPrayerDialog(true);
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Completar dia (Li e orei)
                    </Button>
                  </>
                );
              })()}
            </div>
          ) : (
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                Inicie uma campanha espiritual e transforme sua vida através da Palavra de Deus.
              </p>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Play className="h-4 w-4" />
                    Iniciar Campanha
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Nova Campanha Espiritual</DialogTitle>
                    <DialogDescription>
                      Escolha uma área de foco e a duração da sua jornada de fé.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Área de foco</label>
                      <div className="grid grid-cols-1 gap-2">
                        {CAMPAIGN_TYPES.map((type) => {
                          const Icon = type.icon;
                          return (
                            <button
                              key={type.id}
                              onClick={() => setSelectedType(type.id)}
                              className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                                selectedType === type.id
                                  ? 'border-primary bg-primary/10'
                                  : 'border-border hover:border-primary/50'
                              }`}
                            >
                              <Icon className={`h-5 w-5 ${type.color}`} />
                              <div className="text-left">
                                <p className="font-medium text-sm">{type.name}</p>
                                <p className="text-xs text-muted-foreground">{type.description}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Duração</label>
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
                    </div>

                    <Button onClick={startCampaign} className="w-full">
                      Começar Jornada 🙏
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Prayer completion dialog */}
      <Dialog open={showPrayerDialog} onOpenChange={setShowPrayerDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>🙏 Momento de Oração</DialogTitle>
            <DialogDescription>
              Você leu a passagem do dia. Agora, faça uma oração sincera e com fé.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="bg-primary/10 p-4 rounded-lg">
              <p className="font-semibold text-primary">{currentPassage?.reference}</p>
              <p className="text-sm italic mt-2">"{currentPassage?.text}"</p>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm font-medium mb-2">💡 Sugestão de oração:</p>
              <p className="text-sm text-muted-foreground">
                "Senhor Deus, agradeço pela Tua Palavra que transforma minha vida. 
                Aplique em mim o que li hoje. Fortalece minha fé e guia meus passos. 
                Em nome de Jesus, amém."
              </p>
            </div>

            <Button onClick={markDayComplete} className="w-full">
              <CheckCircle className="h-4 w-4 mr-2" />
              Completei a leitura e oração
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SpiritualCampaigns;
