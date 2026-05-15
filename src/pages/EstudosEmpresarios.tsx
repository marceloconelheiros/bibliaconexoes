import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ArrowLeft, ArrowUpRight, BookMarked, Presentation } from "lucide-react";
import { EXECUTIVE_STUDIES } from "@/data/executiveStudies";
import { bookNames } from "@/data/bookNames";
import { BRAND } from "@/lib/brand";

const EstudosEmpresarios = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-accent/20">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-slate-900 shadow-md ring-1 ring-white/10 dark:ring-white/5">
                <Presentation className="h-6 w-6 text-primary-foreground" strokeWidth={1.75} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">
                  {BRAND.shortName}
                </p>
                <h1 className="font-display text-2xl font-bold">Estudos para líderes</h1>
              </div>
            </div>
          </div>
          <ThemeToggle />
        </div>

        <p className="text-muted-foreground mb-8 leading-relaxed">
          Reflexões curtas para cruzar Escritura com gestão, ética e decisão — sem substituir o texto bíblico. Abra o
          capítulo na Bíblia online para ler o trecho completo e a reflexão no topo da página.
        </p>

        <ScrollArea className="h-[min(72vh,640px)] pr-1">
          <div className="space-y-4 pb-8">
            {EXECUTIVE_STUDIES.map((study) => (
              <Card key={study.id} className="border-border/80 bg-card/90 hover:border-primary/40 transition-colors">
                <CardHeader className="pb-2">
                  <CardTitle className="font-display text-lg leading-snug">{study.title}</CardTitle>
                  <CardDescription className="flex items-center gap-2 font-medium text-primary">
                    <BookMarked className="h-4 w-4" strokeWidth={1.75} />
                    {bookNames[study.bookAbbrev] || study.bookAbbrev} · Capítulo {study.chapter}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{study.lens}</p>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="gap-2"
                    onClick={() => {
                      try {
                        const raw = localStorage.getItem("bc_exec_study_opened") || "{}";
                        const o = JSON.parse(raw) as Record<string, number>;
                        o[study.id] = (o[study.id] ?? 0) + 1;
                        localStorage.setItem("bc_exec_study_opened", JSON.stringify(o));
                      } catch {
                        /* ignore */
                      }
                      navigate(`/biblia?livro=${encodeURIComponent(study.bookAbbrev)}&cap=${study.chapter}`);
                    }}
                  >
                    Abrir na Bíblia
                    <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default EstudosEmpresarios;
