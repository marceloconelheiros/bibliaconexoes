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
import { cn } from "@/lib/utils";
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
    title: "Bíblia em áudio",
    category: "Escuta",
    description: "Ouça com clareza — foco no texto.",
    path: "/audios",
  },
  {
    icon: BookOpen,
    title: "Bíblia para líderes",
    category: "Leitura",
    description: "Texto integral com reflexões onde marca.",
    path: "/biblia",
  },
  {
    icon: BriefcaseBusiness,
    title: "Estudos para empresários",
    category: "Desenvolvimento",
    description: "Escritura e decisão no dia a dia.",
    path: "/estudos-empresarios",
  },
  {
    icon: CalendarCheck,
    title: "Planejador de leitura",
    category: "Hábito",
    description: "Ritmo e acompanhamento do plano.",
    path: "/meus-planos",
  },
];

function greetingPtBR(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

/** Barras estilo dashboard do mockup — traço alto e percentagem destacada. */
function DashboardProgressRow({
  label,
  value,
  featured,
}: {
  label: string;
  value: number;
  featured: boolean;
}) {
  const v = Math.min(100, Math.max(0, Math.round(value)));
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className={cn("text-xs font-semibold", featured ? "text-white/75" : "text-slate-500 dark:text-slate-400")}>{label}</span>
        <span className={cn("text-lg font-bold tabular-nums leading-none", featured ? "text-white" : "text-slate-900 dark:text-white")}>{v}%</span>
      </div>
      <div
        className={cn(
          "h-2.5 w-full overflow-hidden rounded-full",
          featured ? "bg-white/15" : "bg-slate-100 dark:bg-slate-700/80",
        )}
        role="progressbar"
        aria-valuenow={v}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-700 ease-out",
            featured ? "bg-sky-300" : "bg-gradient-to-r from-blue-600 to-sky-500 dark:from-blue-500 dark:to-sky-400",
          )}
          style={{ width: `${v}%` }}
        />
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
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-lg px-4 pb-16 pt-6 sm:max-w-2xl md:max-w-4xl md:px-6 md:pb-20 md:pt-8">
        {/* Barra topo — logo circular + marca (sem caixa quadrada, sem marca-d’água) */}
        <header className="mb-8 flex animate-fade-in items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <img
              src="/logo.png"
              alt=""
              className="h-11 w-11 shrink-0 rounded-full object-cover shadow-[0_4px_14px_rgba(30,58,138,0.15)] ring-2 ring-white dark:ring-slate-800"
            />
            <div className="min-w-0 leading-tight">
              <p className="truncate text-[13px] font-semibold text-slate-800 dark:text-slate-100">{BRAND.name}</p>
              <p className="truncate text-[11px] font-medium uppercase tracking-wide text-blue-700/90 dark:text-sky-400/90">{BRAND.shortName}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button variant="ghost" size="sm" className="hidden h-10 gap-2 rounded-xl px-3 sm:inline-flex" onClick={() => navigate("/perfil")}>
              <Avatar className="h-8 w-8 border border-slate-200 dark:border-slate-600">
                <AvatarImage src={avatarUrl ?? undefined} alt="" />
                <AvatarFallback className="rounded-full bg-slate-100 dark:bg-slate-800">
                  <User className="h-4 w-4 text-slate-500" />
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">Perfil</span>
            </Button>
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl sm:hidden" onClick={() => navigate("/perfil")} aria-label="Perfil">
              <Avatar className="h-9 w-9 border border-slate-200 dark:border-slate-600">
                <AvatarImage src={avatarUrl ?? undefined} alt="" />
                <AvatarFallback className="rounded-full bg-slate-100">
                  <User className="h-4 w-4 text-slate-500" />
                </AvatarFallback>
              </Avatar>
            </Button>
            <ThemeToggle />
          </div>
        </header>

        {/* Saudação forte (mockup) */}
        <section className="mb-6 space-y-1">
          <h1 className="font-display text-[1.65rem] font-bold tracking-tight text-slate-900 dark:text-white md:text-3xl">
            {greetingPtBR()}, {displayName || "bem-vindo"}!
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{BRAND.tagline}</p>
        </section>

        {/* Barra tipo pesquisa */}
        <button
          type="button"
          onClick={() => navigate("/biblia")}
          className="mb-8 flex w-full items-center gap-3 rounded-2xl border border-slate-200/90 bg-white px-4 py-3.5 text-left shadow-[0_2px_12px_rgba(30,58,138,0.06)] transition-colors hover:border-blue-200 hover:bg-slate-50/80 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600 dark:hover:bg-slate-900/90"
        >
          <Search className="h-5 w-5 shrink-0 text-slate-400" aria-hidden />
          <span className="text-sm text-slate-400 dark:text-slate-500">Abrir livro ou capítulo na Bíblia…</span>
        </button>

        {/* Cartão boas-vindas — área visual abstracta à direita */}
        <section className="mb-10 overflow-hidden rounded-3xl border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-blue-50/90 p-5 shadow-[0_12px_40px_-24px_rgba(30,58,138,0.18)] dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 md:flex md:items-center md:gap-8 md:p-7">
          <div className="min-w-0 flex-1 space-y-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-blue-800 shadow-sm dark:bg-slate-800 dark:text-sky-300">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              Palavra para líderes
            </span>
            <h2 className="font-display text-xl font-bold leading-snug text-slate-900 dark:text-white md:text-2xl">{BRAND.description}</h2>
            <Button className="mt-2 h-11 rounded-xl bg-[#1e3a5f] px-6 font-semibold text-white hover:bg-[#152d4d] dark:bg-blue-600 dark:hover:bg-blue-500" onClick={() => navigate("/biblia")}>
              Começar agora
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
          <div className="relative mx-auto mt-6 h-[120px] w-[140px] shrink-0 md:mx-0 md:mt-0 md:h-[140px] md:w-[160px]" aria-hidden>
            <div className="absolute bottom-2 left-4 h-16 w-16 rounded-2xl bg-blue-400/25 dark:bg-blue-500/20" />
            <div className="absolute right-2 top-4 h-20 w-20 rounded-full bg-sky-300/40 dark:bg-sky-500/25" />
            <div className="absolute left-10 top-0 h-14 w-14 rounded-xl bg-[#1e3a5f]/15 dark:bg-sky-400/20" />
          </div>
        </section>

        {/* Secção estilo «ongoing projects» */}
        <section aria-label="Áreas em progresso" className="mb-10">
          <div className="mb-5 flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Progresso</p>
              <h3 className="font-display mt-1 text-lg font-bold text-slate-900 dark:text-white md:text-xl">Suas áreas</h3>
            </div>
            <button type="button" className="text-xs font-semibold text-blue-700 hover:underline dark:text-sky-400" onClick={() => navigate("/meus-planos")}>
              Ver planos
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {HUB_ITEMS.map(({ icon: Icon, title, category, description, path }, idx) => {
              const featured = idx === 1;
              const bars = hubProgressBars(path, coreMetrics);

              return (
                <Card
                  key={path}
                  role="link"
                  tabIndex={0}
                  className={cn(
                    "group cursor-pointer rounded-3xl border shadow-[0_8px_28px_-16px_rgba(30,58,138,0.14)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_36px_-18px_rgba(30,58,138,0.2)] dark:shadow-black/40",
                    featured
                      ? "border-transparent bg-[#1e3a5f] text-white dark:bg-[#1a3352]"
                      : "border-slate-200/90 bg-white dark:border-slate-700 dark:bg-slate-900",
                  )}
                  onClick={() => navigate(path)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      navigate(path);
                    }
                  }}
                >
                  <CardContent className="flex h-full flex-col gap-5 p-6">
                    <div className="flex items-start gap-4">
                      <div
                        className={cn(
                          "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
                          featured ? "bg-white/12 text-sky-200" : "bg-sky-50 text-blue-700 dark:bg-slate-800 dark:text-sky-400",
                        )}
                      >
                        <Icon className="h-5 w-5" strokeWidth={2} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={cn("text-[11px] font-bold uppercase tracking-wide", featured ? "text-sky-200/85" : "text-slate-400 dark:text-slate-500")}>{category}</p>
                        <h4 className={cn("font-display mt-1 text-base font-bold leading-snug md:text-lg", featured ? "text-white" : "text-slate-900 dark:text-white")}>{title}</h4>
                        <p className={cn("mt-2 line-clamp-2 text-[13px] leading-relaxed", featured ? "text-white/75" : "text-slate-500 dark:text-slate-400")}>{description}</p>
                      </div>
                    </div>

                    <div className={cn("space-y-4 border-t pt-4", featured ? "border-white/15" : "border-slate-100 dark:border-slate-700")}>
                      <DashboardProgressRow label="Leitura" value={bars.reading} featured={featured} />
                      <DashboardProgressRow label="Desenvolvimento" value={bars.formation} featured={featured} />
                    </div>

                    <div
                      className={cn(
                        "mt-auto flex items-center gap-1 text-xs font-bold",
                        featured ? "text-sky-200" : "text-blue-700 dark:text-sky-400",
                      )}
                    >
                      Abrir
                      <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <footer className="flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-8 dark:border-slate-800 sm:flex-row">
          <p className="max-w-md text-center text-[11px] leading-relaxed text-slate-400 dark:text-slate-500 sm:text-left">
            Percentagens calculadas neste dispositivo (planos, áudio e estudos abertos).
          </p>
          <button
            type="button"
            onClick={() => void handleInstall()}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium text-slate-400 underline-offset-4 hover:text-blue-700 hover:underline dark:text-slate-500 dark:hover:text-sky-400"
          >
            <Download className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
            Instalar no celular
          </button>
        </footer>
      </div>
    </div>
  );
};

export default Index;
