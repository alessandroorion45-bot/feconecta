import { useState } from "react";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Users, Target, Plus, CheckCircle2, BookOpen, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Goal = { id: number; text: string; completed: boolean };
type Group = { id: number; name: string; members: number; description: string; goals: Goal[]; prayerRequests: string[] };

const mockGroups: Group[] = [
  {
    id: 1, name: "Grupo Vida Nova", members: 5, description: "Discipulado para novos convertidos",
    goals: [
      { id: 1, text: "Ler o Evangelho de João completo", completed: true },
      { id: 2, text: "Memorizar 5 versículos-chave", completed: true },
      { id: 3, text: "Participar de 4 cultos consecutivos", completed: false },
      { id: 4, text: "Compartilhar testemunho pessoal", completed: false },
    ],
    prayerRequests: ["Fortalecimento na fé", "Família aceitar a conversão", "Sabedoria para estudar a Palavra"],
  },
  {
    id: 2, name: "Jovens em Missão", members: 8, description: "Preparação para missões e evangelismo",
    goals: [
      { id: 5, text: "Estudar Atos dos Apóstolos", completed: true },
      { id: 6, text: "Participar de uma ação social", completed: false },
      { id: 7, text: "Evangelizar 3 pessoas", completed: false },
    ],
    prayerRequests: ["Ousadia para evangelizar", "Portas abertas para missões"],
  },
  {
    id: 3, name: "Líderes em Formação", members: 4, description: "Capacitação de novos líderes de célula",
    goals: [
      { id: 8, text: "Concluir curso de liderança", completed: false },
      { id: 9, text: "Liderar uma célula por 1 mês", completed: false },
    ],
    prayerRequests: ["Sabedoria para liderar", "Humildade e serviço"],
  },
];

const SpiritualMentoring = () => {
  const { toast } = useToast();
  const [groups, setGroups] = useState(mockGroups);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  const toggleGoal = (groupId: number, goalId: number) => {
    setGroups(groups.map(g => {
      if (g.id !== groupId) return g;
      return { ...g, goals: g.goals.map(goal => goal.id === goalId ? { ...goal, completed: !goal.completed } : goal) };
    }));
    if (selectedGroup?.id === groupId) {
      setSelectedGroup({
        ...selectedGroup,
        goals: selectedGroup.goals.map(goal => goal.id === goalId ? { ...goal, completed: !goal.completed } : goal),
      });
    }
    toast({ title: "Meta atualizada! ✅" });
  };

  if (selectedGroup) {
    const completedGoals = selectedGroup.goals.filter(g => g.completed).length;
    const progress = selectedGroup.goals.length > 0 ? (completedGoals / selectedGroup.goals.length) * 100 : 0;

    return (
      <div className="min-h-screen bg-gradient-hero">
        <Header />
        <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <Button variant="ghost" className="mb-4" onClick={() => setSelectedGroup(null)}>← Voltar</Button>

          <Card className="shadow-divine mb-6">
            <CardHeader>
              <CardTitle className="text-2xl">{selectedGroup.name}</CardTitle>
              <p className="text-muted-foreground">{selectedGroup.description}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary"><Users className="h-3 w-3 mr-1 inline" /> {selectedGroup.members} membros</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-2 flex justify-between text-sm">
                <span>Progresso Geral</span>
                <span>{progress.toFixed(0)}%</span>
              </div>
              <Progress value={progress} className="h-3" />
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><Target className="h-5 w-5 text-primary" /> Metas Espirituais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedGroup.goals.map(goal => (
                <div key={goal.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 cursor-pointer" onClick={() => toggleGoal(selectedGroup.id, goal.id)}>
                  <CheckCircle2 className={`h-5 w-5 shrink-0 ${goal.completed ? "text-green-500" : "text-muted-foreground"}`} />
                  <span className={goal.completed ? "line-through text-muted-foreground" : ""}>{goal.text}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><Heart className="h-5 w-5 text-primary" /> Pedidos de Oração do Grupo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {selectedGroup.prayerRequests.map((pr, i) => (
                <div key={i} className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  <span>🙏</span>
                  <span className="text-muted-foreground">{pr}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Header />
      <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-divine bg-clip-text text-transparent mb-2">Acompanhamento Espiritual</h1>
          <p className="text-muted-foreground">Discipulado, mentoria e crescimento juntos</p>
        </div>

        <div className="grid gap-4">
          {groups.map(group => {
            const completed = group.goals.filter(g => g.completed).length;
            const progress = group.goals.length > 0 ? (completed / group.goals.length) * 100 : 0;
            return (
              <Card key={group.id} className="cursor-pointer hover:shadow-divine transition-shadow" onClick={() => setSelectedGroup(group)}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-lg">{group.name}</p>
                      <p className="text-sm text-muted-foreground">{group.description}</p>
                    </div>
                    <Badge variant="secondary"><Users className="h-3 w-3 mr-1 inline" /> {group.members}</Badge>
                  </div>
                  <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                    <span>{completed}/{group.goals.length} metas</span>
                    <span>{progress.toFixed(0)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default SpiritualMentoring;
