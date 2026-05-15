import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ArrowLeft, BookText, ChevronRight, Compass, ScrollText, Sparkles } from "lucide-react";
import bibleData from "@/data/bible.json";
import { bookNames } from "@/data/bookNames";
import { getExecutiveStudy } from "@/data/executiveStudies";
import { BRAND } from "@/lib/brand";

interface BibleBook {
  abbrev: string;
  chapters: string[][];
}

type ViewMode = "books" | "chapters" | "reading";

const BibliaOnline = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const deepLinkApplied = useRef(false);

  const [viewMode, setViewMode] = useState<ViewMode>("books");
  const [selectedBook, setSelectedBook] = useState<BibleBook | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);

  const bible = useMemo(() => bibleData as BibleBook[], []);

  useEffect(() => {
    if (deepLinkApplied.current) return;
    const livro = searchParams.get("livro");
    const capRaw = searchParams.get("cap");
    if (!livro || capRaw === null) return;
    const cap = parseInt(capRaw, 10);
    if (!Number.isFinite(cap) || cap < 1) return;
    const book = bible.find((b) => b.abbrev === livro);
    if (!book || cap > book.chapters.length) return;

    deepLinkApplied.current = true;
    setSelectedBook(book);
    setSelectedChapter(cap - 1);
    setViewMode("reading");
    setSearchParams({}, { replace: true });
  }, [searchParams, bible, setSearchParams]);

  const executiveInsight =
    selectedBook && selectedChapter !== null
      ? getExecutiveStudy(selectedBook.abbrev, selectedChapter + 1)
      : undefined;

  const handleBookSelect = (book: BibleBook) => {
    setSelectedBook(book);
    setViewMode("chapters");
  };

  const handleChapterSelect = (chapterIndex: number) => {
    setSelectedChapter(chapterIndex);
    setViewMode("reading");
  };

  const handleBack = () => {
    if (viewMode === "reading") {
      setViewMode("chapters");
      setSelectedChapter(null);
    } else if (viewMode === "chapters") {
      setViewMode("books");
      setSelectedBook(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950/[0.03] via-background to-background dark:from-slate-950/40">
      <div className="border-b border-border/60 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3 max-w-4xl flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Compass className="h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={1.75} />
          <span>
            Conteúdo da experiência <strong className="text-foreground">{BRAND.name}</strong> para quem lidera
            negócios, equipes e decisões — texto bíblico completo com reflexões onde há estudo empresarial.
          </span>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Button variant="ghost" size="icon" onClick={viewMode === "books" ? () => navigate("/") : handleBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-slate-900 shadow-md ring-1 ring-white/10">
                <BookText className="h-6 w-6 text-primary-foreground" strokeWidth={1.75} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">
                  Leitura · perfil executivo
                </p>
                <h1 className="font-display text-xl md:text-2xl font-bold truncate">
                  {viewMode === "books" && "Bíblia Online"}
                  {viewMode === "chapters" && bookNames[selectedBook?.abbrev || ""]}
                  {viewMode === "reading" && `${bookNames[selectedBook?.abbrev || ""]} ${(selectedChapter ?? 0) + 1}`}
                </h1>
                <p className="text-sm text-muted-foreground truncate">
                  {viewMode === "books" && `${bible.length} livros`}
                  {viewMode === "chapters" && `${selectedBook?.chapters.length} capítulos`}
                  {viewMode === "reading" && `${selectedBook?.chapters[selectedChapter ?? 0]?.length} versículos`}
                </p>
              </div>
            </div>
          </div>
          <ThemeToggle />
        </div>

        {viewMode === "books" && (
          <div className="grid gap-3">
            {bible.map((book) => (
              <Card
                key={book.abbrev}
                className="cursor-pointer hover:border-primary/60 hover:shadow-md transition-all border-border/80 bg-card/80"
                onClick={() => handleBookSelect(book)}
              >
                <CardHeader className="py-4">
                  <CardTitle className="flex items-center justify-between text-lg font-display font-semibold">
                    <span>{bookNames[book.abbrev] || book.abbrev}</span>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground font-normal font-sans">
                      <span>{book.chapters.length} cap.</span>
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}

        {viewMode === "chapters" && selectedBook && (
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
            {selectedBook.chapters.map((_, index) => {
              const insight = getExecutiveStudy(selectedBook.abbrev, index + 1);
              return (
                <Button
                  key={index}
                  variant={insight ? "default" : "outline"}
                  className={`h-16 text-lg font-semibold relative ${insight ? "shadow-md" : ""}`}
                  onClick={() => handleChapterSelect(index)}
                  title={insight ? "Tem reflexão para líderes neste capítulo" : undefined}
                >
                  {index + 1}
                  {insight && (
                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-blue-400 ring-2 ring-background" />
                  )}
                </Button>
              );
            })}
          </div>
        )}

        {viewMode === "reading" && selectedBook && selectedChapter !== null && (
          <div className="space-y-6">
            {executiveInsight && (
              <Card className="border-l-4 border-l-blue-500 bg-blue-500/[0.06] dark:bg-blue-500/[0.09] shadow-sm">
                <CardHeader className="pb-2 pt-4">
                  <CardTitle className="flex items-start gap-3 text-lg font-display">
                    <Sparkles className="mt-0.5 h-6 w-6 shrink-0 text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
                    <span>
                      <span className="block text-xs font-sans font-normal uppercase tracking-wider text-muted-foreground mb-1">
                        Momento de reflexão · líderes & negócios
                      </span>
                      {executiveInsight.title}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pb-4">
                  <p className="text-sm leading-relaxed text-foreground/90">{executiveInsight.lens}</p>
                  <Separator />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                      Na prática
                    </p>
                    <ul className="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground">
                      {executiveInsight.aplicacao.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  {executiveInsight.perguntas && executiveInsight.perguntas.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                          Pergunta para você
                        </p>
                        <ul className="space-y-2">
                          {executiveInsight.perguntas.map((q, i) => (
                            <li key={i} className="text-sm italic text-foreground/85 border-l-2 border-primary/30 pl-3">
                              {q}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            <Card className="border-border/80 shadow-sm overflow-hidden">
                <CardHeader className="border-b border-border/60 bg-muted/30 pb-2">
                <CardTitle className="flex items-center gap-2 font-display text-lg">
                  <ScrollText className="h-5 w-5 shrink-0 text-muted-foreground" strokeWidth={1.75} />
                  Texto — capítulo {(selectedChapter ?? 0) + 1}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 pb-6">
                <ScrollArea className="h-[min(62vh,520px)] md:h-[min(68vh,600px)]">
                  <div className="space-y-5 pr-2 pb-4">
                    {selectedBook.chapters[selectedChapter].map((verse, index) => (
                      <p key={index} className="reading-text text-foreground/95 leading-[1.75]">
                        <sup className="text-primary font-semibold mr-2 select-none text-base">{index + 1}</sup>
                        {verse}
                      </p>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default BibliaOnline;
