import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Calendar, CheckCircle2, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ReadingPlan {
  id: string;
  plan_name: string;
  current_day: number;
  total_days: number;
  is_active: boolean;
}

const ReadingPlan = () => {
  const { toast } = useToast();
  const [plan, setPlan] = useState<ReadingPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlan();
  }, []);

  const loadPlan = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('bible_reading_plans')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    setPlan(data);
    setLoading(false);
  };

  const createPlan = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Faça login",
        description: "Você precisa estar logado para criar um plano de leitura.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from('bible_reading_plans')
      .insert({
        user_id: user.id,
        plan_name: 'Plano Anual',
        total_days: 365,
      });

    if (error) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Plano criado!",
        description: "Seu plano de leitura anual foi iniciado.",
      });
      loadPlan();
    }
  };

  const markDayComplete = async () => {
    if (!plan) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const newDay = plan.current_day + 1;

    const { error } = await supabase
      .from('bible_reading_plans')
      .update({ current_day: newDay })
      .eq('id', plan.id);

    if (error) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setPlan({ ...plan, current_day: newDay });
      toast({
        title: "Dia concluído!",
        description: `Você completou o dia ${plan.current_day}. Continue assim!`,
      });
    }
  };

  if (loading) return null;

  if (!plan) {
    return (
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Plano de Leitura
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Comece um plano de leitura bíblica anual e acompanhe seu progresso.
          </p>
          <Button onClick={createPlan} className="w-full">
            <BookOpen className="mr-2 h-4 w-4" />
            Iniciar Plano Anual
          </Button>
        </CardContent>
      </Card>
    );
  }

  const progress = (plan.current_day / plan.total_days) * 100;

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          {plan.plan_name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Dia {plan.current_day} de {plan.total_days}</span>
            <span>{progress.toFixed(0)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        <Button 
          onClick={markDayComplete} 
          className="w-full"
          disabled={plan.current_day >= plan.total_days}
        >
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Marcar Dia como Lido
        </Button>
      </CardContent>
    </Card>
  );
};

export default ReadingPlan;
