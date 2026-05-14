import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  BookOpen,
  Volume2,
  Sparkles,
  CalendarCheck,
  Download,
  BriefcaseBusiness,
  User,
  ChevronRight,
  Search,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useProfileAvatarUrl } from "@/hooks/useProfileAvatarUrl";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BRAND } from "@/lib/brand";
import { computeHubCoreMetrics, hubProgressBars, type HubCoreMetrics } from "@/lib/home-hub-metrics";

type HubItem = {
  icon: LucideIcon;
  title: string;
  category: string;
  description: string;
  path: string;
};

const HUB_ITEMS: HubItem[] = [
  {
    icon: Volume2,
    title: "Áudio",
    category: "Escuta",
    description: "Por capítulo.",
    path: "/audios",
  },
  {
    icon: BookOpen,
    title: "Bíblia",
    category: "Leitura",
    description: "Texto e reflexões.",
    path: "/biblia",
  },
  {
    icon: BriefcaseBusiness,
    title: "Estudos",
    category: "Formação",
    description: "Lentes de gestão.",
    path: "/estudos-empresarios",
  },
  {
    icon: CalendarCheck,
    title: "Planos",
    category: "Hábito",
    description: "Progresso local.",
    path: "/meus-planos",
  },
];

function greetingPtBR(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function CompactProgressRow({ label, value }: { label: string; value: number }) {
  const v = Math.min(100, Math.max(0, Math.round(value)));
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-1">
        <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</span>
        <span className="text-[11px] font-semibold tabular-nums text-slate-800 dark:text-slate-200">{v}%</span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700" role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-slate-800 transition-[width] duration-500 ease-out dark:bg-slate-300" style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session } = useAuth();
  const avatarUrl = useProfileAvatarUrl(session?.user.id);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [coreMetrics, setCoreMetrics] = useState<HubCoreMetrics>(() => computeHubCoreMetrics());

  const displayName = useMemo(() => {
    const meta = session?.user?.user_metadata as { full_name?: string } | undefined;
    const fn = meta?.full_name?.trim();
    if (fn) return fn.split(/\s+/)[0];
    const em = session?.user?.email?.split("@")[0];
    return em || "";
  }, [session]);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    const refresh = () => setCoreMetrics(computeHubCoreMetrics());
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        toast({ title: "App instalado com sucesso!" });
      }
      setDeferredPrompt(null);
    } else {
      navigate("/instalar");
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f5f7] font-sans text-slate-900 antialiased dark:bg-[#0c0e12] dark:text-slate-100">
      {/* Cabeçalho premium — barra fixa, tipografia sóbria */}
      <header className="sticky top-0 z-30 border-b border-slate-200/90 bg-white/85 backdrop-blur-md dark:border-slate-800/90 dark:bg-[#0c0e12]/85">
        <div className="mx-auto flex h-[52px] max-w-3xl items-center justify-between gap-3 px-4 md:h-14 md:px-5">
          <button type="button" onClick={() => navigate("/")} className="group flex min-w-0 items-center gap-2.5 text-left">
            <span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-slate-100 ring-1 ring-slate-200/80 dark:bg-slate-800 dark:ring-slate-700">
              <img src="/logo.png" alt="" className="h-7 w-7 object-contain opacity-95" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-semibold leading-none tracking-tight text-slate-900 dark:text-slate-50">{BRAND.name}</span>
              <span className="mt-0.5 block truncate text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{BRAND.tagline}</span>
            </span>
          </button>

          <div className="flex shrink-0 items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="hidden h-9 gap-2 rounded-md border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 sm:inline-flex"
              onClick={() => navigate("/perfil")}
            >
              <Avatar className="h-6 w-6 border border-slate-200 dark:border-slate-600">
                <AvatarImage src={avatarUrl ?? undefined} alt="" />
                <AvatarFallback className="rounded-full bg-slate-100 text-[10px] dark:bg-slate-800">
                  <User className="h-3.5 w-3.5 text-slate-500" />
                </AvatarFallback>
              </Avatar>
              Conta
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-md border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:hidden"
              onClick={() => navigate("/perfil")}
              aria-label="Conta"
            >
              <Avatar className="h-7 w-7 border-0">
                <AvatarImage src={avatarUrl ?? undefined} alt="" />
                <AvatarFallback className="rounded-full bg-slate-100">
                  <User className="h-3.5 w-3.5 text-slate-500" />
                </AvatarFallback>
              </Avatar>
            </Button>
            <ThemeToggle className="h-9 w-9 shrink-0 rounded-md border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900" />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 pb-14 pt-5 md:px-5 md:pb-16 md:pt-6">
        <section className="mb-5 space-y-0.5">
          <h1 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-50 md:text-xl">
            {greetingPtBR()}, {displayName || "bem-vindo"}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Resumo do seu uso neste dispositivo.</p>
        </section>

        <button
          type="button"
          onClick={() => navigate("/biblia")}
          className="mb-5 flex w-full items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-left shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50/80 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600 dark:hover:bg-slate-800/80"
        >
          <Search className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
          <span className="text-xs text-slate-500 dark:text-slate-400">Ir para Bíblia — livro e capítulo…</span>
        </button>

        <section className="mb-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:flex md:items-center md:gap-6 md:p-5">
          <div className="min-w-0 flex-1 space-y-2">
            <span className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <Sparkles className="h-3 w-3" aria-hidden />
              {BRAND.shortName}
            </span>
            <p className="text-sm font-medium leading-snug text-slate-800 dark:text-slate-100">{BRAND.description}</p>
            <Button size="sm" className="mt-1 h-8 rounded-md bg-slate-900 px-4 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white" onClick={() => navigate("/biblia")}>
              Abrir Bíblia
              <ChevronRight className="ml-0.5 h-3.5 w-3.5" />
            </Button>
          </div>
        </section>

        <section aria-label="Áreas" className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Áreas</h2>
            <button type="button" className="text-[11px] font-medium text-slate-600 underline-offset-2 hover:underline dark:text-slate-300" onClick={() => navigate("/meus-planos")}>
              Planos
            </button>
          </div>

          {/* Sempre 2 cartões por linha, mesmo tamanho, compactos */}
          <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
            {HUB_ITEMS.map(({ icon: Icon, title, category, description, path }) => {
              const bars = hubProgressBars(path, coreMetrics);
              return (
                <Card
                  key={path}
                  role="link"
                  tabIndex={0}
                  className="group cursor-pointer rounded-lg border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600"
                  onClick={() => navigate(path)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      navigate(path);
                    }
                  }}
                >
                  <CardContent className="flex h-full min-h-[148px] flex-col gap-2.5 p-3 sm:min-h-[156px] sm:p-3.5">
                    <div className="flex items-start gap-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        <Icon className="h-4 w-4" strokeWidth={2} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">{category}</p>
                        <h3 className="mt-0.5 line-clamp-2 text-[13px] font-semibold leading-tight tracking-tight text-slate-900 dark:text-slate-50 sm:text-sm">{title}</h3>
                      </div>
                    </div>
                    <p className="line-clamp-1 text-[10px] leading-tight text-slate-500 dark:text-slate-400">{description}</p>
                    <div className="mt-auto space-y-2 border-t border-slate-100 pt-2 dark:border-slate-800">
                      <CompactProgressRow label="Leitura" value={bars.reading} />
                      <CompactProgressRow label="Desenv." value={bars.formation} />
                    </div>
                    <div className="flex items-center gap-0.5 text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                      Abrir
                      <ChevronRight className="h-3 w-3 opacity-70 transition-transform group-hover:translate-x-px" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <footer className="flex flex-col items-stretch justify-between gap-3 border-t border-slate-200 pt-6 dark:border-slate-800 sm:flex-row sm:items-center">
          <p className="text-center text-[10px] leading-relaxed text-slate-400 dark:text-slate-500 sm:text-left">Métricas locais: planos, áudio e estudos.</p>
          <button
            type="button"
            onClick={() => void handleInstall()}
            className="inline-flex items-center justify-center gap-1.5 self-center rounded-md border border-transparent py-1.5 text-[10px] font-medium text-slate-400 transition-colors hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 sm:self-auto"
          >
            <Download className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
            Instalar no celular
          </button>
        </footer>
      </div>
    </div>
  );
};

export default Index;
