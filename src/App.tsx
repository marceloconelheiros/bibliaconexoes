import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { isSupabaseEnvReady } from "@/lib/supabase-env";

const AppRoutes = lazy(() => import("./AppRoutes"));

const queryClient = new QueryClient();

function EnvMissing() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center bg-background text-foreground">
        <h1 className="text-xl font-semibold">Configuração incompleta</h1>
        <p className="max-w-lg text-muted-foreground text-sm leading-relaxed">
          Na Vercel: <strong className="text-foreground">Settings → Environment Variables</strong> (ambiente{" "}
          <strong className="text-foreground">Production</strong>) com{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">VITE_SUPABASE_URL</code> no formato{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">https://xxxx.supabase.co</code> (copie do
          Supabase → Settings → API, <strong className="text-foreground">sem aspas</strong>) e{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">VITE_SUPABASE_PUBLISHABLE_KEY</code> (anon
          public). Depois <strong className="text-foreground">Deployments → Redeploy</strong> — o Vite só
          lê essas variáveis na hora do build.
        </p>
      </div>
    </ThemeProvider>
  );
}

const App = () => {
  if (!isSupabaseEnvReady()) {
    return <EnvMissing />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Suspense
            fallback={
              <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            }
          >
            <AppRoutes />
          </Suspense>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
