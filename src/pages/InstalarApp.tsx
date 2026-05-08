import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, ArrowLeft, Smartphone, Share, Home } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BRAND } from "@/lib/brand";

const InstalarApp = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Detectar iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Verificar se já está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Capturar evento de instalação (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      toast({
        title: "Instalação não disponível",
        description: "Use as instruções abaixo para instalar o app.",
        variant: "destructive",
      });
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      toast({
        title: "App instalado!",
        description: `O ${BRAND.name} foi adicionado à sua tela inicial.`,
      });
      setDeferredPrompt(null);
    }
  };

  if (isInstalled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-secondary/20 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-6 w-6" />
              App já instalado!
            </CardTitle>
            <CardDescription>
              O {BRAND.name} já está instalado no seu dispositivo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/")} className="w-full">
              <Home className="mr-2 h-4 w-4" />
              Voltar para o início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-secondary/20 p-4">
      <div className="max-w-2xl mx-auto py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-6 w-6" />
                Instalar {BRAND.name}
              </CardTitle>
              <CardDescription>
                Instale o app na sua tela inicial para acesso rápido
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isIOS && deferredPrompt && (
                <Button onClick={handleInstallClick} className="w-full" size="lg">
                  <Download className="mr-2 h-5 w-5" />
                  Instalar App Agora
                </Button>
              )}

              {isIOS && (
                <Card className="bg-muted">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Smartphone className="h-5 w-5" />
                      Instruções para iPhone/iPad
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                          1
                        </div>
                        <div>
                          <p className="font-medium">Abra o Safari</p>
                          <p className="text-sm text-muted-foreground">
                            Este site deve ser aberto no navegador Safari
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                          2
                        </div>
                        <div>
                          <p className="font-medium">Toque no botão Compartilhar</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Share className="h-4 w-4 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                              Ícone de compartilhar na barra inferior
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                          3
                        </div>
                        <div>
                          <p className="font-medium">Adicionar à Tela de Início</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Home className="h-4 w-4 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                              Role e toque em "Adicionar à Tela de Início"
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                          4
                        </div>
                        <div>
                          <p className="font-medium">Confirme</p>
                          <p className="text-sm text-muted-foreground">
                            Toque em "Adicionar" no canto superior direito
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        ✨ Pronto! O ícone do {BRAND.name} aparecerá na sua tela inicial como um app nativo.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {!isIOS && !deferredPrompt && (
                <Card className="bg-muted">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Smartphone className="h-5 w-5" />
                      Instruções para Android/Chrome
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                          1
                        </div>
                        <div>
                          <p className="font-medium">Abra o menu do navegador</p>
                          <p className="text-sm text-muted-foreground">
                            Toque nos três pontos (⋮) no canto superior direito
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                          2
                        </div>
                        <div>
                          <p className="font-medium">Instalar app</p>
                          <p className="text-sm text-muted-foreground">
                            Toque em "Instalar app" ou "Adicionar à tela inicial"
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                          3
                        </div>
                        <div>
                          <p className="font-medium">Confirme</p>
                          <p className="text-sm text-muted-foreground">
                            Toque em "Instalar" na janela que aparece
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        ✨ Pronto! O ícone do {BRAND.name} aparecerá na sua tela inicial.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Benefícios do App Instalado</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Acesso rápido direto da tela inicial</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Funciona offline após o primeiro uso</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Experiência em tela cheia, sem barra do navegador</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Carregamento mais rápido</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default InstalarApp;