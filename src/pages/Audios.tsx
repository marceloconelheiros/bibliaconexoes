import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, Volume2, Play, Pause } from "lucide-react";
import { toast } from "sonner";
import { getAudioPlaybackUrl, getAudiosObjectPath } from "@/lib/audio-playback-url";

interface ChapterTimestamp {
  chapter: number;
  time: number;
}

interface AudioTrack {
  id: string;
  title: string;
  audio_url: string | null;
  book_id: string;
  psalms_group: string;
  chapter_timestamps: ChapterTimestamp[];
}

interface Book {
  id: string;
  name: string;
  abbrev: string;
  testament: string;
  order_index: number;
}

const Audios = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([]);
  const [books, setBooks] = useState<Map<string, Book>>(new Map());
  const [currentPlaying, setCurrentPlaying] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);

  useEffect(() => {
    void loadAudioData();
  }, []);

  const loadAudioData = async () => {
    setLoading(true);
    // Load books first to ensure proper ordering
    const { data: booksData, error: booksError } = await supabase
      .from("books")
      .select("*")
      .order("order_index");

    if (booksError) {
      toast.error("Erro ao carregar livros");
      setLoading(false);
      return;
    }

    // Load all audio tracks
    const { data: tracks, error: tracksError } = await supabase
      .from("audio_tracks")
      .select("*");

    if (tracksError) {
      toast.error("Erro ao carregar áudios");
      setLoading(false);
      return;
    }

    // Create a map for quick book lookup
    const booksMap = new Map(booksData?.map(b => [b.id, b]) || []);
    
    // Sort tracks by book order and cast chapter_timestamps
    const sortedTracks = (tracks || []).map(track => ({
      ...track,
      chapter_timestamps: ((track.chapter_timestamps || []) as unknown) as ChapterTimestamp[]
    })).sort((a, b) => {
      const bookA = booksMap.get(a.book_id);
      const bookB = booksMap.get(b.book_id);
      if (!bookA || !bookB) return 0;
      
      // First sort by book order
      if (bookA.order_index !== bookB.order_index) {
        return bookA.order_index - bookB.order_index;
      }
      
      // For Psalms, sort by psalms_group
      if (a.psalms_group !== 'NONE' && b.psalms_group !== 'NONE') {
        return a.psalms_group.localeCompare(b.psalms_group);
      }
      
      return 0;
    });
    
    setAudioTracks(sortedTracks);
    setBooks(booksMap);
    setLoading(false);
  };

  const saveAudioProgress = (trackId: string, time: number) => {
    localStorage.setItem(`audio_progress_${trackId}`, time.toString());
  };

  const getAudioProgress = (trackId: string): number => {
    const saved = localStorage.getItem(`audio_progress_${trackId}`);
    return saved ? parseFloat(saved) : 0;
  };

  const playAudio = async (track: AudioTrack) => {
    const book = books.get(track.book_id);
    const src = getAudioPlaybackUrl(track, book);
    const objectPath = getAudiosObjectPath(track, book);

    if (!src) {
      toast.error(
        "Sem URL para esta faixa — verifique se o livro tem abbrev no Supabase ou se VITE_SUPABASE_URL está no .env.",
      );
      return;
    }

    // If clicking on the same track, pause and dismiss player chrome
    if (currentPlaying === track.id && audioElement) {
      saveAudioProgress(track.id, audioElement.currentTime);
      audioElement.pause();
      setAudioElement(null);
      setCurrentPlaying(null);
      setCurrentTime(0);
      setDuration(0);
      return;
    }

    // Stop current audio if playing another track
    if (audioElement) {
      saveAudioProgress(currentPlaying!, audioElement.currentTime);
      audioElement.pause();
      setAudioElement(null);
    }

    const fileHint = objectPath ? `"${objectPath}" na raiz do bucket audios` : "o arquivo esperado na raiz do bucket audios";

    try {
      try {
        const probe = await fetch(src, { method: "HEAD", mode: "cors" });
        if (!probe.ok && probe.status !== 405) {
          toast.error(
            `HTTP ${probe.status} ao buscar o áudio. Envie ${fileHint} (Storage → bucket público **audios**) ou use audio_url nesta faixa.`,
          );
          return;
        }
      } catch {
        /* HEAD pode falhar por rede/CORS; o elemento <audio> tentará mesmo assim */
      }

      const audio = new Audio(src);

      audio.onerror = () => {
        const code = audio.error?.code;
        const fileMsg = objectPath ? `Esperado: ${objectPath} no bucket audios.` : "";
        const hints: Record<number, string> = {
          2: "Erro de rede ou CORS.",
          3: "O servidor não devolveu um áudio válido (corpo pode ser JSON de erro).",
          4: `Resposta não é MP3 ou arquivo ausente. ${fileMsg}`,
        };
        const hint = code != null ? hints[code] ?? "" : "";
        console.error("[Áudio]", track.title, src, audio.error);
        toast.error(`Não foi possível carregar o áudio.${hint ? ` ${hint}` : ""}`);
        setCurrentPlaying(null);
        setAudioElement(null);
      };

      audio.onended = () => {
        saveAudioProgress(track.id, 0);
        setCurrentPlaying(null);
        setAudioElement(null);
        setCurrentTime(0);
        setDuration(0);
      };

      audio.onloadedmetadata = () => {
        setDuration(audio.duration);
        const savedTime = getAudioProgress(track.id);
        if (savedTime > 0 && savedTime < audio.duration) {
          audio.currentTime = savedTime;
          setCurrentTime(savedTime);
        }
      };

      audio.ontimeupdate = () => {
        setCurrentTime(audio.currentTime);
        saveAudioProgress(track.id, audio.currentTime);
      };

      setAudioElement(audio);
      setCurrentPlaying(track.id);

      audio.play().catch((error: Error) => {
        if (error.name !== "AbortError") {
          console.error("Erro ao reproduzir áudio:", error);
          toast.error(`Erro ao reproduzir ${track.title}`);
          setCurrentPlaying(null);
          setAudioElement(null);
        }
      });
    } catch (error) {
      console.error("Erro ao criar áudio:", error);
      toast.error(`Erro ao preparar áudio de ${track.title}`);
    }
  };

  const handleSeek = (value: number[]) => {
    if (audioElement && currentPlaying) {
      audioElement.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const jumpToChapter = (time: number) => {
    if (audioElement) {
      audioElement.currentTime = time;
      setCurrentTime(time);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/10">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center">
                <Volume2 className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Bíblia em Áudio</h1>
                <p className="text-sm text-muted-foreground">
                  {
                    audioTracks.filter((t) => getAudioPlaybackUrl(t, books.get(t.book_id))).length
                  }{" "}
                  de {audioTracks.length} faixas com áudio configurado
                </p>
              </div>
            </div>
          </div>
          <ThemeToggle />
        </div>

        {/* Audio List */}
        <div className="space-y-4">
          {audioTracks.length === 0 ? (
            <Card>
              <CardContent className="py-12 space-y-4 text-center px-4">
                <Volume2 className="w-12 h-12 mx-auto text-muted-foreground" />
                <p className="text-muted-foreground font-medium">Nenhuma faixa listada</p>
                <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
                  O app busca os registros nas tabelas <code className="text-xs">books</code> e{" "}
                  <code className="text-xs">audio_tracks</code> do Supabase. Se o projeto está vazio,
                  aplique as migrações (por exemplo{" "}
                  <code className="text-xs">20260509140000_seed_books_and_audio_tracks.sql</code>) ou rode{" "}
                  <code className="text-xs">supabase db push</code>. Depois, envie os MP3 ao bucket{" "}
                  <code className="text-xs">audios</code> com o nome{" "}
                  <code className="text-xs">Gn.mp3</code>, <code className="text-xs">Sl_PS1.mp3</code>, etc.
                </p>
              </CardContent>
            </Card>
          ) : (
            audioTracks.map((track) => {
              const book = books.get(track.book_id);
              const isPlaying = currentPlaying === track.id;
              const canPlay = !!getAudioPlaybackUrl(track, book);

              return (
                <Card 
                  key={track.id}
                  className={`transition-all ${isPlaying ? 'border-primary border-2 shadow-lg' : ''}`}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div>
                        <div className="text-lg">{book?.name || track.title}</div>
                        {track.psalms_group !== 'NONE' && (
                          <div className="text-sm font-normal text-muted-foreground">
                            {track.title}
                          </div>
                        )}
                      </div>
                      <Button
                        size="icon"
                        variant={isPlaying ? "default" : "outline"}
                        onClick={() => playAudio(track)}
                        disabled={!canPlay}
                      >
                        {isPlaying ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  {isPlaying && (
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Slider
                          value={[currentTime]}
                          max={duration}
                          step={1}
                          onValueChange={handleSeek}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{formatTime(currentTime)}</span>
                          <span>{formatTime(duration)}</span>
                        </div>
                      </div>
                      
                      {track.chapter_timestamps && track.chapter_timestamps.length > 0 && (
                        <div className="border-t pt-3">
                          <p className="text-sm font-medium mb-2">Capítulos:</p>
                          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2 max-h-32 bc-scroll-y">
                            {track.chapter_timestamps.map((chapter) => (
                              <Button
                                key={chapter.chapter}
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs"
                                onClick={() => jumpToChapter(chapter.time)}
                              >
                                {chapter.chapter}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  )}
                  {!canPlay && (
                    <CardContent>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Sem arquivo encontrado para esta faixa. Envie o MP3 ao bucket público{" "}
                        <code className="text-xs">audios</code> com o nome{" "}
                        <code className="text-xs">
                          {book?.abbrev ? `${book.abbrev}${track.psalms_group !== "NONE" ? `_${track.psalms_group}` : ""}.mp3` : "{abbrev}.mp3"}
                        </code>
                        , ou preencha{" "}
                        <code className="text-xs">audio_url</code> na linha deste livro. O app também monta a URL a partir de{" "}
                        <code className="text-xs">VITE_SUPABASE_URL</code> automaticamente.
                      </p>
                    </CardContent>
                  )}
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Audios;