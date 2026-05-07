import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BookOpen, Volume2, Sparkles, CalendarCheck, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/20 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      
      <div className="container mx-auto px-4 py-8 max-w-5xl relative">
        {/* Header */}
        <div className="flex justify-between items-center mb-12 animate-fade-in">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="BíbliaFlow" className="w-16 h-16 rounded-3xl shadow-lg" />
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                BíbliaFlow
              </h1>
              <p className="text-sm text-muted-foreground">Sua jornada de leitura bíblica</p>
            </div>
          </div>
          <ThemeToggle />
        </div>

        {/* Hero Section */}
        <div className="text-center mb-12 animate-fade-in space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Explore a Palavra de Deus</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Leia e Ouça a Bíblia
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
            Acesse o texto completo da Bíblia ou ouça os áudios enquanto acompanha sua jornada espiritual
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
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card 
            className="group cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-105 border-0 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground animate-fade-in overflow-hidden rounded-lg"
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
            className="group cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-105 border-0 bg-gradient-to-br from-purple-500 to-purple-600 text-white animate-fade-in overflow-hidden shadow-xl rounded-lg"
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
                    Bíblia Online
                  </h3>
                  <p className="text-sm md:text-base text-white/90 leading-relaxed">
                    Leia e estude as Escrituras Sagradas com interface moderna e prática.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="group cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-105 border-0 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white animate-fade-in overflow-hidden shadow-xl rounded-lg"
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
          <div className="text-center p-6 rounded-2xl bg-card/30 backdrop-blur border border-border/50">
            <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Volume2 className="w-6 h-6 text-accent" />
            </div>
            <h4 className="font-semibold mb-2">Áudio Premium</h4>
            <p className="text-sm text-muted-foreground">Ouça com qualidade excepcional</p>
          </div>
          
          <div className="text-center p-6 rounded-2xl bg-card/30 backdrop-blur border border-border/50">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <h4 className="font-semibold mb-2">Texto Completo</h4>
            <p className="text-sm text-muted-foreground">Acesse todos os livros da Bíblia</p>
          </div>

          <div className="text-center p-6 rounded-2xl bg-card/30 backdrop-blur border border-border/50">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CalendarCheck className="w-6 h-6 text-emerald-500" />
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
