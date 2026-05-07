import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ArrowLeft, BookOpen, ChevronRight } from "lucide-react";
import bibleData from "@/data/bible.json";
import { bookNames } from "@/data/bookNames";

interface BibleBook {
  abbrev: string;
  chapters: string[][];
}

type ViewMode = "books" | "chapters" | "reading";

const BibliaOnline = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>("books");
  const [selectedBook, setSelectedBook] = useState<BibleBook | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const bible = bibleData as BibleBook[];

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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/10">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={viewMode === "books" ? () => navigate("/") : handleBack}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  {viewMode === "books" && "Bíblia Online"}
                  {viewMode === "chapters" && bookNames[selectedBook?.abbrev || ""]}
                  {viewMode === "reading" && `${bookNames[selectedBook?.abbrev || ""]} ${(selectedChapter || 0) + 1}`}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {viewMode === "books" && `${bible.length} livros`}
                  {viewMode === "chapters" && `${selectedBook?.chapters.length} capítulos`}
                  {viewMode === "reading" && `${selectedBook?.chapters[selectedChapter || 0]?.length} versículos`}
                </p>
              </div>
            </div>
          </div>
          <ThemeToggle />
        </div>

        {/* Books List */}
        {viewMode === "books" && (
          <div className="grid gap-3">
            {bible.map((book) => (
              <Card 
                key={book.abbrev}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => handleBookSelect(book)}
              >
                <CardHeader className="py-4">
                  <CardTitle className="flex items-center justify-between text-lg">
                    <span>{bookNames[book.abbrev] || book.abbrev}</span>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground font-normal">
                      <span>{book.chapters.length} cap.</span>
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}

        {/* Chapters List */}
        {viewMode === "chapters" && selectedBook && (
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
            {selectedBook.chapters.map((_, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-16 text-lg font-semibold"
                onClick={() => handleChapterSelect(index)}
              >
                {index + 1}
              </Button>
            ))}
          </div>
        )}

        {/* Reading View */}
        {viewMode === "reading" && selectedBook && selectedChapter !== null && (
          <Card>
            <CardContent className="pt-6">
              <ScrollArea className="h-[calc(100vh-280px)]">
                <div className="space-y-4 pr-4">
                  {selectedBook.chapters[selectedChapter].map((verse, index) => (
                    <p key={index} className="reading-text">
                      <sup className="text-primary font-semibold mr-2">{index + 1}</sup>
                      {verse}
                    </p>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BibliaOnline;
