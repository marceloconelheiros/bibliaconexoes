import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PlanModeCard, PlanMode } from "@/components/PlanModeCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

type PlanStyle = "SEQUENTIAL" | "MIX_ON" | "TRIAD";

const Planos = () => {
  const navigate = useNavigate();
  const [selectedMode, setSelectedMode] = useState<PlanMode | null>(null);
  const [style, setStyle] = useState<PlanStyle>("SEQUENTIAL");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreatePlan = async () => {
    setLoading(true);
    try {
      const daysByMode: Record<string, number> = {
        ULTRA_15: 15,
        FAST_30: 30,
        BALANCED_90: 90,
        COMFY_180: 180,
        CLASSIC_365: 365
      };

      const days_total = daysByMode[selectedMode!];
      const planTitle = title || `Plano ${selectedMode!.replace('_','-')} (${days_total} dias)`;

      const newPlan = {
        id: crypto.randomUUID(),
        title: planTitle,
        mode: selectedMode,
        style,
        start_date: startDate,
        days_total,
        created_at: new Date().toISOString(),
      };

      // Salvar no localStorage
      const savedPlans = localStorage.getItem("bible_plans");
      const plans = savedPlans ? JSON.parse(savedPlans) : [];
      plans.push(newPlan);
      localStorage.setItem("bible_plans", JSON.stringify(plans));

      toast.success("Plano criado com sucesso!");
      navigate("/meus-planos");
    } catch (error: any) {
      toast.error("Erro ao criar plano");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex justify-between items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <ThemeToggle />
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-3">Escolha Seu Plano de Leitura</h1>
          <p className="text-muted-foreground text-lg">
            Planos prontos para ler a Bíblia completa em 3, 6 meses ou 1 ano
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <PlanModeCard mode="BALANCED_90" onSelect={setSelectedMode} />
          <PlanModeCard mode="COMFY_180" onSelect={setSelectedMode} />
          <PlanModeCard mode="CLASSIC_365" onSelect={setSelectedMode} />
        </div>

        <details className="mb-6">
          <summary className="cursor-pointer text-center text-sm text-muted-foreground hover:text-foreground transition-colors">
            Ver planos alternativos (leitura intensiva)
          </summary>
          <div className="grid md:grid-cols-2 gap-6 mt-4">
            <PlanModeCard mode="ULTRA_15" onSelect={setSelectedMode} />
            <PlanModeCard mode="FAST_30" onSelect={setSelectedMode} />
          </div>
        </details>

        <Dialog open={selectedMode !== null} onOpenChange={() => setSelectedMode(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Configurar Plano</DialogTitle>
              <DialogDescription>
                Personalize seu plano de leitura
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Nome do Plano (opcional)</Label>
                <Input
                  id="title"
                  placeholder="Meu Plano de Leitura"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="style">Estilo de Leitura</Label>
                <Select value={style} onValueChange={(v) => setStyle(v as PlanStyle)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SEQUENTIAL">Sequencial (Gênesis → Apocalipse)</SelectItem>
                    <SelectItem value="MIX_ON">Misto (70% AT, 30% NT)</SelectItem>
                    <SelectItem value="TRIAD">Tríade (AT + NT + Salmos)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate">Data de Início</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <Button
                className="w-full"
                onClick={handleCreatePlan}
                disabled={loading}
              >
                {loading ? "Criando..." : "Criar Plano"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Planos;
