import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BookOpen, Volume2, Sparkles, CalendarCheck, Download, BriefcaseBusiness, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BRAND } from "@/lib/brand";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
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
      // Fallback: iOS or already installed
      navigate("/instalar");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-accent/25 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-10%,hsl(var(--primary)/0.12),transparent)] pointer-events-none" />
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-[28rem] h-[28rem] bg-slate-400/15 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
      
      <div className="container mx-auto px-4 py-8 max-w-5xl relative">
        {/* Header */}
        <div className="flex justify-between items-center mb-12 animate-fade-in">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt={BRAND.name} className="w-16 h-16 rounded-3xl shadow-lg ring-2 ring-primary/15" />
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground tracking-tight">
                {BRAND.name}
              </h1>
              <p className="text-sm font-medium text-primary/90">{BRAND.tagline}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" className="gap-2 hidden sm:inline-flex" onClick={() => navigate("/perfil")}>
              <User className="w-4 h-4" />
              Perfil
            </Button>
            <Button variant="outline" size="icon" className="sm:hidden" onClick={() => navigate("/perfil")} aria-label="Perfil">
              <User className="w-5 h-5" />
            </Button>
            <ThemeToggle />
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-12 animate-fade-in space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-4 border border-primary/15">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Fé nos negócios · decisões com propósito</span>
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Palavra para quem lidera
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6 leading-relaxed">
            {BRAND.description}
          </p>
          <Button 
            onClick={handleInstall}
            size="lg"
            className="gap-2 shadow-lg hover:shadow-xl transition-all"
          >
            <Download className="w-5 h-5" />
            Instalar App no Celular
          </Button>
        </div>

        {/* Main Cards */}
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">
          <Card 
            className="group cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] border-0 bg-gradient-to-br from-primary to-slate-900 text-primary-foreground animate-fade-in overflow-hidden rounded-xl shadow-xl"
            onClick={() => navigate("/audios")}
          >
            <CardContent className="p-6 md:p-8 relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 md:w-16 md:h-16 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform relative z-10 flex-shrink-0">
                  <Volume2 className="w-7 h-7 md:w-8 md:h-8 text-primary-foreground" />
                </div>
                <div className="relative z-10">
                  <h3 className="text-xl md:text-2xl font-bold mb-1">
                    Bíblia em Áudio
                  </h3>
                  <p className="text-sm md:text-base text-primary-foreground/90 leading-relaxed">
                    Ouça a Palavra de Deus em qualquer lugar. Áudios de alta qualidade para sua meditação diária.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="group cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] border-0 bg-gradient-to-br from-slate-700 to-blue-950 text-white animate-fade-in overflow-hidden shadow-xl rounded-xl"
            onClick={() => navigate("/biblia")}
          >
            <CardContent className="p-6 md:p-8 relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 md:w-16 md:h-16 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform relative z-10 flex-shrink-0">
                  <BookOpen className="w-7 h-7 md:w-8 md:h-8 text-white" />
                </div>
                <div className="relative z-10">
                  <h3 className="text-xl md:text-2xl font-bold mb-1">
                    Bíblia para líderes
                  </h3>
                  <p className="text-sm md:text-base text-white/90 leading-relaxed">
                    Texto completo com reflexões de gestão e ética nos capítulos-chave — pensado para o dia a dia
                    corporativo.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="group cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] border border-border/80 bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 text-white animate-fade-in overflow-hidden shadow-xl rounded-xl"
            onClick={() => navigate("/estudos-empresarios")}
          >
            <CardContent className="p-6 md:p-8 relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 md:w-16 md:h-16 bg-white/10 backdrop-blur rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform relative z-10 flex-shrink-0">
                  <BriefcaseBusiness className="w-7 h-7 md:w-8 md:h-8 text-white" />
                </div>
                <div className="relative z-10">
                  <h3 className="text-xl md:text-2xl font-bold mb-1">Estudos para empresários</h3>
                  <p className="text-sm md:text-base text-white/85 leading-relaxed">
                    Pílulas de Escritura com foco em liderança, integridade e decisão — abra direto na Bíblia.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="group cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] border-0 bg-gradient-to-br from-slate-800 to-primary text-primary-foreground animate-fade-in overflow-hidden shadow-xl rounded-xl"
            onClick={() => navigate("/meus-planos")}
          >
            <CardContent className="p-6 md:p-8 relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 md:w-16 md:h-16 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform relative z-10 flex-shrink-0">
                  <CalendarCheck className="w-7 h-7 md:w-8 md:h-8 text-white" />
                </div>
                <div className="relative z-10">
                  <h3 className="text-xl md:text-2xl font-bold mb-1">
                    Planejador de Leitura
                  </h3>
                  <p className="text-sm md:text-base text-white/90 leading-relaxed">
                    Crie planos de leitura bíblica e acompanhe seu progresso diário.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
          <div className="text-center p-6 rounded-2xl bg-card/40 backdrop-blur border border-border/50 shadow-sm">
            <div className="w-12 h-12 bg-primary/12 rounded-full flex items-center justify-center mx-auto mb-4">
              <Volume2 className="w-6 h-6 text-primary" />
            </div>
            <h4 className="font-semibold mb-2">Áudio Premium</h4>
            <p className="text-sm text-muted-foreground">Ouça com qualidade excepcional</p>
          </div>
          
          <div className="text-center p-6 rounded-2xl bg-card/40 backdrop-blur border border-border/50 shadow-sm">
            <div className="w-12 h-12 bg-blue-500/12 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-6 h-6 text-blue-700 dark:text-blue-400" />
            </div>
            <h4 className="font-semibold mb-2">Bíblia + reflexão</h4>
            <p className="text-sm text-muted-foreground">Capítulos marcados com insight para negócios</p>
          </div>

          <div className="text-center p-6 rounded-2xl bg-card/40 backdrop-blur border border-border/50 shadow-sm">
            <div className="w-12 h-12 bg-slate-800/10 dark:bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <BriefcaseBusiness className="w-6 h-6 text-slate-800 dark:text-slate-200" />
            </div>
            <h4 className="font-semibold mb-2">Estudos executivos</h4>
            <p className="text-sm text-muted-foreground">Lista curada com link direto ao capítulo</p>
          </div>

          <div className="text-center p-6 rounded-2xl bg-card/40 backdrop-blur border border-border/50 shadow-sm">
            <div className="w-12 h-12 bg-slate-500/15 rounded-full flex items-center justify-center mx-auto mb-4">
              <CalendarCheck className="w-6 h-6 text-slate-700 dark:text-slate-300" />
            </div>
            <h4 className="font-semibold mb-2">Planos Personalizados</h4>
            <p className="text-sm text-muted-foreground">3, 6 meses ou 1 ano de leitura</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
