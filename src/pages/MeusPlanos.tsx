import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ProgressBar } from "@/components/ProgressBar";
import { ArrowLeft, Plus, BookOpen, Calendar, TrendingUp, Trash2 } from "lucide-react";

type Plan = {
  id: string;
  title: string;
  mode: string;
  style: string;
  start_date: string;
  days_total: number;
  created_at: string;
};

const MeusPlanos = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = () => {
    const savedPlans = localStorage.getItem("bible_plans");
    if (savedPlans) {
      setPlans(JSON.parse(savedPlans));
    }
    setLoading(false);
  };

  const deletePlan = (planId: string) => {
    const updatedPlans = plans.filter(p => p.id !== planId);
    localStorage.setItem("bible_plans", JSON.stringify(updatedPlans));
    
    // Remove progress do plano também
    localStorage.removeItem(`plan_progress_${planId}`);
    
    setPlans(updatedPlans);
  };

  const getModeLabel = (mode: string) => {
    const labels: Record<string, string> = {
      BALANCED_90: "3 Meses (90 dias)",
      COMFY_180: "6 Meses (180 dias)",
      CLASSIC_365: "1 Ano (365 dias)",
      FAST_30: "30 Dias",
      ULTRA_15: "15 Dias",
    };
    return labels[mode] || mode;
  };

  const getProgress = (planId: string, totalDays: number) => {
    const progressData = localStorage.getItem(`plan_progress_${planId}`);
    if (!progressData) return 0;
    
    const progress = JSON.parse(progressData);
    return Object.keys(progress).length;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex justify-between items-center mb-6">
          <Button variant="ghost" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Início
          </Button>
          <ThemeToggle />
        </div>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Meus Planos</h1>
          <p className="text-muted-foreground">
            Acompanhe seu progresso e continue sua jornada
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        ) : plans.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Nenhum plano criado</h3>
              <p className="text-muted-foreground mb-6">
                Crie seu primeiro plano de leitura bíblica
              </p>
              <Button onClick={() => navigate("/planos")}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Plano
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-end mb-4">
              <Button onClick={() => navigate("/planos")}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Plano
              </Button>
            </div>

            <div className="grid gap-4">
              {plans.map((plan) => {
                const progressCount = getProgress(plan.id, plan.days_total);
                
                return (
                  <Card
                    key={plan.id}
                    className="hover:shadow-lg transition-shadow"
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div 
                          className="flex-1 cursor-pointer"
                          onClick={() => navigate(`/plano/${plan.id}`)}
                        >
                          <CardTitle className="text-xl">{plan.title}</CardTitle>
                          <CardDescription className="flex items-center gap-4 mt-2">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {getModeLabel(plan.mode)}
                            </span>
                            <span className="flex items-center gap-1">
                              <TrendingUp className="w-4 h-4" />
                              {plan.style === "SEQUENTIAL" && "Sequencial"}
                              {plan.style === "MIX_ON" && "Misto"}
                              {plan.style === "TRIAD" && "Tríade"}
                            </span>
                          </CardDescription>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm("Tem certeza que deseja excluir este plano?")) {
                              deletePlan(plan.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent onClick={() => navigate(`/plano/${plan.id}`)} className="cursor-pointer">
                      <ProgressBar value={progressCount} max={plan.days_total} />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MeusPlanos;
