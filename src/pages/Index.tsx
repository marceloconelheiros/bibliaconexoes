import { useState, useEffect } from "react";
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

type HubItem = {
  icon: LucideIcon;
  title: string;
  description: string;
  path: string;
};

const HUB_ITEMS: HubItem[] = [
  {
    icon: Volume2,
    title: "Bíblia em áudio",
    description: "Ouça com clareza em qualquer lugar — foco e reverência no texto.",
    path: "/audios",
  },
  {
    icon: BookOpen,
    title: "Bíblia para líderes",
    description: "Texto integral com reflexões de gestão e ética nos capítulos marcados.",
    path: "/biblia",
  },
  {
    icon: BriefcaseBusiness,
    title: "Estudos para empresários",
    description: "Leituras curtas que cruzam Escritura com decisão e integridade.",
    path: "/estudos-empresarios",
  },
  {
    icon: CalendarCheck,
    title: "Planejador de leitura",
    description: "Monte seu ritmo — 15 dias a um ano — e acompanhe o progresso.",
    path: "/meus-planos",
  },
];

const HIGHLIGHTS: { icon: LucideIcon; label: string; detail: string }[] = [
  { icon: Volume2, label: "Áudio", detail: "narração estável e navegação por capítulo" },
  { icon: BookOpen, label: "Reflexão", detail: "insights para o dia a dia corporativo" },
  { icon: BriefcaseBusiness, label: "Estudos", detail: "lista curada com link direto" },
  { icon: CalendarCheck, label: "Planos", detail: "ritmo sob medida para você" },
];

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session } = useAuth();
  const avatarUrl = useProfileAvatarUrl(session?.user.id);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
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

  const hubCardClass =
    "group relative cursor-pointer rounded-lg border border-border/70 bg-card/75 shadow-[0_1px_0_0_hsl(var(--border)/0.55)] backdrop-blur-md transition-all duration-300 hover:border-primary/40 hover:bg-card hover:shadow-[0_12px_40px_-12px_hsl(var(--primary)/0.18)] dark:border-border/50 dark:bg-card/40 dark:hover:bg-card/55";

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Ambiente visual discreto */}
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--muted)/0.35)_45%,hsl(var(--background))_100%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_85%_55%_at_50%_-15%,hsl(var(--primary)/0.14),transparent_55%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute right-[-20%] top-1/3 h-[420px] w-[420px] rounded-full bg-primary/[0.06] blur-3xl dark:bg-primary/[0.08]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-[-15%] bottom-0 h-[320px] w-[320px] rounded-full bg-slate-500/[0.07] blur-3xl dark:bg-slate-400/[0.05]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-5xl px-4 pb-16 pt-10 md:px-6 md:pb-20 md:pt-12">
        {/* Topo */}
        <header className="mb-14 flex animate-fade-in items-start justify-between gap-6 border-b border-border/50 pb-8 md:mb-16 md:items-center">
          <div className="flex min-w-0 items-center gap-4">
            <img
              src="/logo.png"
              alt={BRAND.name}
              className="h-14 w-14 shrink-0 rounded-lg object-cover shadow-md ring-1 ring-border/60 md:h-16 md:w-16"
            />
            <div className="min-w-0">
              <p className="font-display text-xl font-semibold tracking-tight text-foreground md:text-2xl">{BRAND.name}</p>
              <p className="mt-1 max-w-md text-[11px] font-medium uppercase leading-snug tracking-[0.18em] text-primary md:text-xs">
                {BRAND.tagline}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="hidden gap-2 border-border/80 bg-background/80 pr-3 backdrop-blur-sm sm:inline-flex"
              onClick={() => navigate("/perfil")}
            >
              <Avatar className="h-8 w-8 border border-border/60 shadow-sm">
                <AvatarImage src={avatarUrl ?? undefined} alt="" />
                <AvatarFallback className="rounded-full bg-muted">
                  <User className="h-4 w-4 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              Perfil
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 overflow-hidden rounded-full border-border/80 bg-background/80 p-0 backdrop-blur-sm sm:hidden"
              onClick={() => navigate("/perfil")}
              aria-label="Perfil"
            >
              <Avatar className="h-full w-full border-0">
                <AvatarImage src={avatarUrl ?? undefined} alt="" />
                <AvatarFallback className="rounded-full bg-muted">
                  <User className="h-5 w-5 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
            </Button>
            <ThemeToggle />
          </div>
        </header>

        {/* Hero */}
        <section className="mx-auto mb-16 max-w-3xl animate-fade-in text-center md:mb-20">
          <div className="mb-6 inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/[0.07] px-3 py-1.5 dark:bg-primary/[0.11]">
            <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
            <span className="text-xs font-medium tracking-wide text-primary md:text-sm">Fé nos negócios · decisões com propósito</span>
          </div>
          <h2 className="font-display text-[2rem] font-semibold leading-[1.15] tracking-tight text-foreground md:text-5xl md:leading-[1.1]">
            Palavra para quem lidera
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-muted-foreground md:text-lg">
            {BRAND.description}
          </p>
          <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button
              size="lg"
              className="h-12 min-w-[220px] rounded-lg px-8 font-medium shadow-[0_1px_0_0_hsl(0_0%_100%/0.12)_inset] dark:shadow-[0_1px_0_0_hsl(0_0%_100%/0.06)_inset]"
              onClick={handleInstall}
            >
              <Download className="h-5 w-5" />
              Instalar no celular
            </Button>
            <Button variant="ghost" size="lg" className="h-12 rounded-lg text-muted-foreground hover:text-foreground" onClick={() => navigate("/biblia")}>
              Abrir a Bíblia
              <ChevronRight className="h-4 w-4 opacity-70" />
            </Button>
          </div>
        </section>

        {/* Grade principal */}
        <section aria-label="Acesso rápido" className="mb-16 md:mb-20">
          <div className="mb-8 flex flex-col gap-1 md:mb-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Acesso rápido</p>
            <h3 className="font-display text-xl font-semibold text-foreground md:text-2xl">Tudo em um só lugar</h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:gap-5">
            {HUB_ITEMS.map(({ icon: Icon, title, description, path }) => (
              <Card key={path} className={cn("shadow-none", hubCardClass)} onClick={() => navigate(path)}>
                <CardContent className="flex h-full flex-col gap-5 p-6 md:p-7">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/[0.09] text-primary ring-1 ring-primary/[0.14] transition-colors group-hover:bg-primary/[0.14] group-hover:ring-primary/25 dark:bg-primary/[0.12] dark:ring-primary/20">
                      <Icon className="h-5 w-5" strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <h4 className="font-display text-lg font-semibold leading-snug text-foreground">{title}</h4>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
                    </div>
                  </div>
                  <div className="mt-auto flex items-center gap-1 text-xs font-medium text-primary opacity-90 transition-opacity group-hover:opacity-100">
                    <span>Entrar</span>
                    <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Faixa de destaques — mesmo idioma visual */}
        <section
          aria-label="Destaques da experiência"
          className="rounded-lg border border-border/60 bg-muted/25 px-5 py-8 backdrop-blur-sm dark:bg-muted/10 md:px-8 md:py-10"
        >
          <p className="mb-6 text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Experiência completa
          </p>
          <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {HIGHLIGHTS.map(({ icon: Icon, label, detail }) => (
              <li key={label} className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background/80 ring-1 ring-border/60 dark:bg-background/40">
                  <Icon className="h-4 w-4 text-primary" strokeWidth={1.75} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{label}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
};

export default Index;
