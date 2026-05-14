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
    description: "Ouça com clareza — foco e reverência no texto.",
    path: "/audios",
  },
  {
    icon: BookOpen,
    title: "Bíblia para líderes",
    category: "Leitura",
    description: "Texto integral com reflexões nos capítulos marcados.",
    path: "/biblia",
  },
  {
    icon: BriefcaseBusiness,
    title: "Estudos para empresários",
    category: "Desenvolvimento",
    description: "Escritura cruzada com gestão e integridade.",
    path: "/estudos-empresarios",
  },
  {
    icon: CalendarCheck,
    title: "Planejador de leitura",
    category: "Hábito",
    description: "Monte seu ritmo e acompanhe o progresso.",
    path: "/meus-planos",
  },
];

function greetingPtBR(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function ThinProgressBar({
  label,
  value,
  variant,
}: {
  label: string;
  value: number;
  variant: "lightOnDark" | "darkOnLight";
}) {
  const fill =
    variant === "lightOnDark"
      ? "bg-[#93c5fd]"
      : "bg-[linear-gradient(90deg,#1e5a96,#2563eb)] dark:bg-[#60a5fa]";
  const track =
    variant === "lightOnDark" ? "bg-white/15" : "bg-[#0f2747]/[0.08] dark:bg-white/15";

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] font-medium uppercase tracking-wide opacity-90">
        <span>{label}</span>
        <span>{Math.round(value)}%</span>
      </div>
      <div className={cn("h-1.5 w-full overflow-hidden rounded-full", track)} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
        <div className={cn("h-full rounded-full transition-[width] duration-500 ease-out", fill)} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
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
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(165deg,#f5f9fd_0%,#e8f1fb_42%,#dceaf7_100%)] text-[#0f2747] dark:bg-[linear-gradient(165deg,#0c1629_0%,#111d33_45%,#152642_100%)] dark:text-[#e8f2fc]">
      {/* Logo integrado ao fundo (sem “caixa”) */}
      <div className="pointer-events-none absolute left-1/2 top-[2%] z-0 w-[min(120vw,680px)] -translate-x-1/2 select-none opacity-[0.065] dark:opacity-[0.09]" aria-hidden>
        <img src="/logo.png" alt="" className="mx-auto h-auto w-full max-w-none scale-110 object-contain blur-[0.5px] saturate-150 dark:saturate-100" />
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_90%_-10%,rgba(37,99,235,0.11),transparent_55%)] dark:bg-[radial-gradient(ellipse_70%_45%_at_90%_-10%,rgba(59,130,246,0.14),transparent_50%)]" aria-hidden />
      <div className="pointer-events-none absolute bottom-[-18%] left-[-12%] h-[340px] w-[340px] rounded-full bg-[#2563eb]/[0.06] blur-3xl dark:bg-[#3b82f6]/10" aria-hidden />
      <div className="pointer-events-none absolute bottom-[12%] right-[-8%] h-[260px] w-[260px] rounded-full bg-[#0f2747]/[0.05] blur-3xl dark:bg-[#93c5fd]/[0.07]" aria-hidden />

      <div className="relative z-[1] mx-auto max-w-5xl px-4 pb-20 pt-8 md:px-6 md:pb-24 md:pt-10">
        <header className="mb-10 flex animate-fade-in items-start justify-between gap-4 md:mb-12 md:items-center">
          <div className="min-w-0 flex-1 pt-1">
            <p className="text-[13px] font-semibold leading-snug text-[#1e5a96] dark:text-[#93c5fd] md:text-sm">
              {greetingPtBR()}
              {displayName ? `, ${displayName}!` : "!"}
            </p>
            <h1 className="font-display mt-1 text-lg font-bold tracking-tight text-[#0f2747] dark:text-white md:text-xl">{BRAND.name}</h1>
            <p className="mt-1 max-w-md text-[11px] font-medium uppercase tracking-[0.16em] text-[#5c7a9e] dark:text-[#94a8c4]">{BRAND.tagline}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2 rounded-full bg-white/70 px-1 py-1 shadow-sm shadow-[#0f2747]/5 backdrop-blur-md dark:bg-[#152642]/80 dark:shadow-black/30">
            <Button
              variant="ghost"
              size="sm"
              className="hidden gap-2 rounded-full px-3 text-[#0f2747] hover:bg-[#e8f1fb] dark:text-[#e8f2fc] dark:hover:bg-white/10 sm:inline-flex"
              onClick={() => navigate("/perfil")}
            >
              <Avatar className="h-8 w-8 border border-[#cfe0f5] shadow-sm dark:border-white/15">
                <AvatarImage src={avatarUrl ?? undefined} alt="" />
                <AvatarFallback className="rounded-full bg-[#e8f1fb] dark:bg-white/10">
                  <User className="h-4 w-4 text-[#5c7a9e]" />
                </AvatarFallback>
              </Avatar>
              Perfil
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full text-[#0f2747] hover:bg-[#e8f1fb] dark:text-[#e8f2fc] dark:hover:bg-white/10 sm:hidden"
              onClick={() => navigate("/perfil")}
              aria-label="Perfil"
            >
              <Avatar className="h-9 w-9 border border-[#cfe0f5] dark:border-white/15">
                <AvatarImage src={avatarUrl ?? undefined} alt="" />
                <AvatarFallback className="rounded-full bg-[#e8f1fb] dark:bg-white/10">
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            </Button>
            <ThemeToggle />
          </div>
        </header>

        {/* Banner tipo mockup */}
        <section className="mx-auto mb-10 max-w-3xl animate-fade-in rounded-[22px] border border-[#c8dcf0]/80 bg-[linear-gradient(135deg,#dbeafe_0%,#eff6ff_55%,#ffffff_100%)] p-5 shadow-[0_18px_48px_-24px_rgba(15,39,71,0.35)] dark:border-white/10 dark:bg-[linear-gradient(135deg,#1a3358_0%,#152642_100%)] dark:shadow-black/40 md:mb-12 md:p-7">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between md:gap-8">
            <div className="min-w-0 flex-1 space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#93c5fd]/60 bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#1e5a96] dark:border-[#60a5fa]/35 dark:bg-white/10 dark:text-[#bfdbfe]">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                Fé nos negócios
              </div>
              <h2 className="font-display text-2xl font-bold leading-[1.15] tracking-tight text-[#0f2747] dark:text-white md:text-[2rem]">
                Palavra para quem lidera
              </h2>
              <p className="max-w-xl text-sm leading-relaxed text-[#3d5a78] dark:text-[#b8cce8]">{BRAND.description}</p>
            </div>
            <div className="flex shrink-0 flex-col gap-2 md:items-end">
              <Button
                size="lg"
                className="h-11 min-w-[200px] rounded-xl bg-[#0f2747] font-semibold text-white shadow-[0_12px_28px_-12px_rgba(15,39,71,0.55)] hover:bg-[#163557] dark:bg-[#2563eb] dark:hover:bg-[#1d4ed8]"
                onClick={() => navigate("/biblia")}
              >
                Abrir a Bíblia
                <ChevronRight className="ml-1 h-4 w-4 opacity-90" />
              </Button>
            </div>
          </div>
        </section>

        {/* Cards principais */}
        <section aria-label="Acesso rápido" className="mb-12 md:mb-14">
          <div className="mb-6 flex flex-col gap-1 md:mb-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#5c7a9e] dark:text-[#8ca5c9]">Áreas</p>
            <h3 className="font-display text-xl font-bold text-[#0f2747] dark:text-white md:text-2xl">Continue de onde parou</h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 xl:gap-6">
            {HUB_ITEMS.map(({ icon: Icon, title, category, description, path }, idx) => {
              const featured = idx === 1;
              const bars = hubProgressBars(path, coreMetrics);

              return (
                <Card
                  key={path}
                  role="link"
                  tabIndex={0}
                  className={cn(
                    "group cursor-pointer rounded-[22px] border-0 shadow-[0_14px_40px_-28px_rgba(15,39,71,0.45)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_48px_-28px_rgba(15,39,71,0.5)] dark:shadow-black/50 dark:hover:shadow-black/60",
                    featured
                      ? "bg-[#0f2747] text-white ring-1 ring-white/10 dark:bg-[#152642]"
                      : "border border-[#d4e6f7]/90 bg-white/92 backdrop-blur-sm dark:border-white/10 dark:bg-[#162d4f]/85",
                  )}
                  onClick={() => navigate(path)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      navigate(path);
                    }
                  }}
                >
                  <CardContent className="flex h-full flex-col gap-5 p-6 md:p-7">
                    <div className="flex items-start gap-4">
                      <div
                        className={cn(
                          "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
                          featured ? "bg-white/12 text-[#bfdbfe]" : "bg-[#e8f1fb] text-[#1e5a96] dark:bg-white/10 dark:text-[#93c5fd]",
                        )}
                      >
                        <Icon className="h-6 w-6" strokeWidth={1.65} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            "text-[10px] font-bold uppercase tracking-[0.18em]",
                            featured ? "text-[#93c5fd]/90" : "text-[#5c7a9e] dark:text-[#94a8c4]",
                          )}
                        >
                          {category}
                        </p>
                        <h4 className={cn("font-display mt-1 text-lg font-bold leading-snug md:text-xl", featured ? "text-white" : "text-[#0f2747] dark:text-white")}>
                          {title}
                        </h4>
                        <p className={cn("mt-2 text-sm leading-relaxed", featured ? "text-[#cbdaf0]" : "text-[#4d6888] dark:text-[#aec7e6]")}>{description}</p>
                      </div>
                    </div>

                    <div className={cn("space-y-3 rounded-xl px-1 py-1", featured ? "" : "")}>
                      <ThinProgressBar label="Leitura" value={bars.reading} variant={featured ? "lightOnDark" : "darkOnLight"} />
                      <ThinProgressBar label="Desenvolvimento" value={bars.formation} variant={featured ? "lightOnDark" : "darkOnLight"} />
                    </div>

                    <div
                      className={cn(
                        "mt-auto flex items-center gap-1 text-xs font-semibold",
                        featured ? "text-[#bfdbfe]" : "text-[#1e5a96] dark:text-[#93c5fd]",
                      )}
                    >
                      <span>Entrar</span>
                      <ChevronRight className="h-3.5 w-3.5 opacity-90 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <footer className="flex flex-col items-center justify-between gap-4 border-t border-[#c8dcf0]/70 pt-8 dark:border-white/10 sm:flex-row">
          <p className="text-center text-[11px] text-[#5c7a9e] dark:text-[#8ca5c9]">Os níveis refletem o uso neste dispositivo (planos, áudio e estudos).</p>
          <button
            type="button"
            onClick={() => void handleInstall()}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium text-[#5c7a9e] transition-colors hover:bg-[#dceaf7]/80 hover:text-[#0f2747] dark:text-[#94a8c4] dark:hover:bg-white/10 dark:hover:text-[#e8f2fc]"
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
