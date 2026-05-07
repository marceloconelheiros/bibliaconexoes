import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ProgressBar } from "@/components/ProgressBar";
import { toast } from "sonner";
import { ArrowLeft, Calendar, BookOpen, TrendingUp } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import bibleData from "@/data/bible.json";

type Plan = {
  id: string;
  title: string;
  mode: string;
  style: string;
  start_date: string;
  days_total: number;
  created_at: string;
};

type DayPlan = {
  dayNumber: number;
  date: string;
  chapters: Array<{
    book: string;
    chapter: number;
    id: string;
  }>;
};

const BOOK_CHAPTERS = [
  50,40,27,36,34,24,21,4,31,24,22,25,29,36,10,13,10,42,150,31,12,8,66,52,5,48,12,14,3,9,1,4,7,3,3,3,2,14,4,28,16,24,21,28,16,16,13,6,6,4,4,5,3,6,4,1,13,5,5,3,5,1,1,1,22
];

const PlanoDetalhes = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [planDays, setPlanDays] = useState<DayPlan[]>([]);
  const [progress, setProgress] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadPlanData();
    }
  }, [id]);

  const loadPlanData = () => {
    const savedPlans = localStorage.getItem("bible_plans");
    if (!savedPlans) {
      navigate("/meus-planos");
      return;
    }

    const plans: Plan[] = JSON.parse(savedPlans);
    const currentPlan = plans.find(p => p.id === id);
    
    if (!currentPlan) {
      navigate("/meus-planos");
      return;
    }

    setPlan(currentPlan);
    
    // Gerar distribuição de capítulos
    const distribution = generateDistribution(currentPlan.days_total, currentPlan.style);
    setPlanDays(distribution);

    // Carregar progresso
    const savedProgress = localStorage.getItem(`plan_progress_${id}`);
    if (savedProgress) {
      setProgress(new Set(Object.keys(JSON.parse(savedProgress))));
    }

    setLoading(false);
  };

  const generateDistribution = (days: number, style: string): DayPlan[] => {
    const allChapters: Array<{ book: string; chapter: number; id: string; bookIndex: number }> = [];
    const books = bibleData as any[];
    
    books.forEach((book, bookIndex) => {
      const chapterCount = BOOK_CHAPTERS[bookIndex];
      for (let ch = 1; ch <= chapterCount; ch++) {
        allChapters.push({
          book: book.abbrev,
          chapter: ch,
          id: `${book.abbrev}-${ch}`,
          bookIndex
        });
      }
    });

    const chaptersPerDay = Math.ceil(allChapters.length / days);
    const result: DayPlan[] = [];
    const startDate = new Date(plan?.start_date || new Date());

    for (let d = 0; d < days; d++) {
      const dayDate = new Date(startDate);
      dayDate.setDate(startDate.getDate() + d);
      
      const dayChapters = allChapters.slice(d * chaptersPerDay, (d + 1) * chaptersPerDay);
      
      result.push({
        dayNumber: d + 1,
        date: dayDate.toISOString().split('T')[0],
        chapters: dayChapters.map(ch => ({
          book: ch.book,
          chapter: ch.chapter,
          id: ch.id
        }))
      });
    }

    return result;
  };

  const toggleChapter = (chapterId: string, checked: boolean) => {
    const progressData = localStorage.getItem(`plan_progress_${id}`) || "{}";
    const progressObj = JSON.parse(progressData);

    if (checked) {
      progressObj[chapterId] = new Date().toISOString();
    } else {
      delete progressObj[chapterId];
    }

    localStorage.setItem(`plan_progress_${id}`, JSON.stringify(progressObj));

    setProgress((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(chapterId);
      } else {
        newSet.delete(chapterId);
      }
      return newSet;
    });

    toast.success(checked ? "Capítulo marcado!" : "Marcação removida");
  };

  const getTotalChapters = () => {
    return planDays.reduce((acc, day) => acc + day.chapters.length, 0);
  };

  const getCompletedChapters = () => {
    return progress.size;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!plan) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <Button variant="ghost" onClick={() => navigate("/meus-planos")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Meus Planos
          </Button>
          <ThemeToggle />
        </div>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{plan.title}</h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {plan.days_total} dias • Início: {new Date(plan.start_date).toLocaleDateString("pt-BR")}
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Progresso Geral</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <ProgressBar
                  value={getCompletedChapters()}
                  max={getTotalChapters()}
                />
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-primary/10">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="w-4 h-4 text-primary" />
                      <span className="text-sm text-muted-foreground">Capítulos Lidos</span>
                    </div>
                    <p className="text-2xl font-bold text-primary">{getCompletedChapters()}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Faltando</span>
                    </div>
                    <p className="text-2xl font-bold">{getTotalChapters() - getCompletedChapters()}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Lidos", value: getCompletedChapters() },
                        { name: "Restantes", value: getTotalChapters() - getCompletedChapters() },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      <Cell fill="hsl(var(--primary))" />
                      <Cell fill="hsl(var(--muted))" />
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {planDays.map((day) => {
            const dayProgress = day.chapters.filter((ch) =>
              progress.has(ch.id)
            ).length;
            const dayTotal = day.chapters.length;

            return (
              <Card key={day.dayNumber}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">Dia {day.dayNumber}</CardTitle>
                      <CardDescription>
                        {new Date(day.date).toLocaleDateString("pt-BR", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                        })}
                      </CardDescription>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {dayProgress}/{dayTotal} capítulos
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {day.chapters.map((chapter) => {
                      const isChecked = progress.has(chapter.id);

                      return (
                        <div
                          key={chapter.id}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
                        >
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={(checked) =>
                              toggleChapter(chapter.id, checked as boolean)
                            }
                          />
                          <BookOpen className="w-4 h-4 text-muted-foreground" />
                          <span className={isChecked ? "line-through text-muted-foreground" : ""}>
                            {chapter.book} {chapter.chapter}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PlanoDetalhes;
