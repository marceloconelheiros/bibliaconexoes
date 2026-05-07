import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Zap, Target, Coffee, BookOpen } from "lucide-react";

export type PlanMode = "ULTRA_15" | "FAST_30" | "BALANCED_90" | "COMFY_180" | "CLASSIC_365";

interface PlanModeCardProps {
  mode: PlanMode;
  onSelect: (mode: PlanMode) => void;
}

const planConfigs = {
  ULTRA_15: {
    title: "Ultrarápido",
    days: 15,
    description: "Para quem quer uma leitura intensiva",
    icon: Zap,
    color: "text-orange-500",
    bgColor: "bg-orange-50 dark:bg-orange-950/20",
  },
  FAST_30: {
    title: "Rápido",
    days: 30,
    description: "Leitura acelerada, mas confortável",
    icon: Target,
    color: "text-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
  },
  BALANCED_90: {
    title: "3 Meses",
    days: 90,
    description: "Ritmo constante e sustentável",
    icon: Clock,
    color: "text-purple-500",
    bgColor: "bg-purple-50 dark:bg-purple-950/20",
  },
  COMFY_180: {
    title: "6 Meses",
    days: 180,
    description: "Leitura tranquila e reflexiva",
    icon: Coffee,
    color: "text-green-500",
    bgColor: "bg-green-50 dark:bg-green-950/20",
  },
  CLASSIC_365: {
    title: "1 Ano",
    days: 365,
    description: "Um ano completo de jornada",
    icon: BookOpen,
    color: "text-indigo-500",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/20",
  },
};

export const PlanModeCard = ({ mode, onSelect }: PlanModeCardProps) => {
  const config = planConfigs[mode];
  const Icon = config.icon;

  return (
    <Card 
      className="hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-primary"
      onClick={() => onSelect(mode)}
    >
      <CardHeader>
        <div className={`w-12 h-12 rounded-full ${config.bgColor} flex items-center justify-center mb-3`}>
          <Icon className={`w-6 h-6 ${config.color}`} />
        </div>
        <CardTitle className="text-2xl">{config.title}</CardTitle>
        <CardDescription className="text-base">
          {config.days} dias • {config.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button className="w-full" variant="outline">
          Escolher Plano
        </Button>
      </CardContent>
    </Card>
  );
};
