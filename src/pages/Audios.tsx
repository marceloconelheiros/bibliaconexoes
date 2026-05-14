import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, Volume2, Play, Pause, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import {
  audiosBuiltInPlaybackConfigured,
  ChapterMp3Item,
  getAudiosChapterRootDirectoryPath,
  getAudiosObjectPath,
  listSortedChapterMp3ForDirectory,
  resolveAudiosPlaybackUrl,
} from "@/lib/audio-playback-url";
import { getAudiosBucketId } from "@/lib/supabase-env";

async function messageFromStorageErrorResponse(res: Response): Promise<string | undefined> {
  try {
    const text = await res.text();
    if (!text.trimStart().startsWith("{")) return undefined;
    const j = JSON.parse(text) as { message?: string; error?: string };
    return j.message ?? j.error;
  } catch {
    return undefined;
  }
}

function audioStorageFailureToast(
  status: number,
  apiMsg: string | undefined,
  objectPath: string | null,
): string {
  const bucket = getAudiosBucketId();
  const head = `HTTP ${status} ao buscar o áudio.${apiMsg ? ` ${apiMsg}.` : ""}`;
  const nome = objectPath ? `"${objectPath}"` : '"Gn.mp3" (exemplo)';
  if (status === 401 || /no api key/i.test(apiMsg ?? "")) {
    return `${head} Verifica se o URL usa /storage/v1/object/… e não /rest/v1/object/… (este último exige chave). Na Vercel, confere VITE_PUBLIC_AUDIO_BASE_URL e na tabela audio_url.`;
  }
  if (/not\s*found|nosuchkey|object\s+not\s+found/i.test(apiMsg ?? "")) {
    return `${head} O ficheiro não existe nesse caminho no Storage (bucket «${bucket}»). Caminho esperado (relativo ao bucket): ${nome}. Confirme VITE_SUPABASE_AUDIOS_PREFIX (ex.: Biblia), books.audio_folder, ou caminho em audio_url (pasta ou ficheiro .mp3).`;
  }
  return `${head} Usa no bucket «${bucket}» o caminho ${nome} — ou preenche audio_url nesta faixa.`;
}

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
  audio_folder?: string | null;
}

type PlaybackTail =
  | { kind: "legacy"; trackId: string }
  | { kind: "chapters"; trackId: string; items: ChapterMp3Item[]; index: number };

const Audios = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([]);
  const [books, setBooks] = useState<Map<string, Book>>(new Map());
  const [currentPlaying, setCurrentPlaying] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);

  const [expandedTrackId, setExpandedTrackId] = useState<string | null>(null);
  const [chapterCache, setChapterCache] = useState<Map<string, ChapterMp3Item[]>>(new Map());
  const [chapterLoadingTrackId, setChapterLoadingTrackId] = useState<string | null>(null);
  /** Capítulo dentro da lista em reprodução (com fila até ao fim do livro). */
  const [playingChapters, setPlayingChapters] = useState<{
    trackId: string;
    items: ChapterMp3Item[];
    index: number;
  } | null>(null);

  const playbackTailRef = useRef<PlaybackTail | null>(null);

  useEffect(() => {
    void loadAudioData();
  }, []);

  const loadAudioData = async () => {
    setLoading(true);
    const { data: booksData, error: booksError } = await supabase
      .from("books")
      .select("*")
      .order("order_index");

    if (booksError) {
      toast.error("Erro ao carregar livros");
      setLoading(false);
      return;
    }

    const { data: tracks, error: tracksError } = await supabase.from("audio_tracks").select("*");

    if (tracksError) {
      toast.error("Erro ao carregar áudios");
      setLoading(false);
      return;
    }

    const booksMap = new Map(booksData?.map((b) => [b.id, b]) || []);

    const sortedTracks = (tracks || [])
      .map((track) => ({
        ...track,
        chapter_timestamps: (track.chapter_timestamps || []) as unknown as ChapterTimestamp[],
      }))
      .sort((a, b) => {
        const bookA = booksMap.get(a.book_id);
        const bookB = booksMap.get(b.book_id);
        if (!bookA || !bookB) return 0;

        if (bookA.order_index !== bookB.order_index) {
          return bookA.order_index - bookB.order_index;
        }

        if (a.psalms_group !== "NONE" && b.psalms_group !== "NONE") {
          return a.psalms_group.localeCompare(b.psalms_group);
        }

        return 0;
      });

    setAudioTracks(sortedTracks);
    setBooks(booksMap);
    setLoading(false);
  };

  const saveLegacyProgress = (trackId: string, time: number) => {
    localStorage.setItem(`audio_progress_${trackId}`, time.toString());
  };

  const getLegacyProgress = (trackId: string): number => {
    const saved = localStorage.getItem(`audio_progress_${trackId}`);
    return saved ? parseFloat(saved) : 0;
  };

  const saveChapterProgress = (trackId: string, objectPath: string, time: number) => {
    const key = `audio_progress_${trackId}_${objectPath}`;
    localStorage.setItem(key, time.toString());
  };

  const getChapterProgress = (trackId: string, objectPath: string): number => {
    const saved = localStorage.getItem(`audio_progress_${trackId}_${objectPath}`);
    return saved ? parseFloat(saved) : 0;
  };

  const stopCurrentAudio = useCallback(() => {
    playbackTailRef.current = null;
    setPlayingChapters(null);
    setAudioElement((prev) => {
      if (prev) {
        prev.pause();
        prev.src = "";
      }
      return null;
    });
  }, []);

  const ensureChapterListLoaded = async (track: AudioTrack, book: Book): Promise<ChapterMp3Item[]> => {
    const cached = chapterCache.get(track.id);
    if (cached) return cached;

    const root = getAudiosChapterRootDirectoryPath(track, book);
    if (!root) return [];

    setChapterLoadingTrackId(track.id);
    const list = await listSortedChapterMp3ForDirectory(root);
    setChapterCache((m) => new Map(m).set(track.id, list));
    setChapterLoadingTrackId(null);
    return list;
  };

  const probeSrc = async (src: string, objectPath: string): Promise<boolean> => {
    try {
      const probe = await fetch(src, {
        method: "GET",
        mode: "cors",
        headers: { Range: "bytes=0-0" },
      });
      const probeOk = probe.ok || probe.status === 206 || probe.status === 416;
      if (!probeOk) {
        const apiMsg = await messageFromStorageErrorResponse(probe);
        toast.error(audioStorageFailureToast(probe.status, apiMsg, objectPath));
        return false;
      }
    } catch {
      /* rede/CORS; o elemento <audio> tentará mesmo assim */
    }
    return true;
  };

  const playChapterAtIndex = async (track: AudioTrack, items: ChapterMp3Item[], index: number) => {
    const item = items[index];
    if (!item || !books.get(track.book_id)) return;

    if (audioElement && playbackTailRef.current) {
      const prev = playbackTailRef.current;
      if (prev.kind === "legacy") {
        saveLegacyProgress(prev.trackId, audioElement.currentTime);
      } else {
        const prevItem = prev.items[prev.index];
        if (prevItem) saveChapterProgress(prev.trackId, prevItem.objectPath, audioElement.currentTime);
      }
      audioElement.pause();
    }

    const ok = await probeSrc(item.publicUrl, item.objectPath);
    if (!ok) return;

    const audio = new Audio(item.publicUrl);

    playbackTailRef.current = { kind: "chapters", trackId: track.id, items, index };
    setPlayingChapters({ trackId: track.id, items, index });
    setCurrentPlaying(track.id);

    audio.onerror = () => {
      const code = audio.error?.code;
      const hints: Record<number, string> = {
        2: "Erro de rede ou CORS.",
        3: "O servidor não devolveu áudio válido.",
        4: `Cap. ${item.chapter}: resposta não é MP3 ou ficheiro em falta. Caminho no bucket: ${item.objectPath}.`,
      };
      const hint = code != null ? hints[code] ?? "" : "";
      console.error("[Áudio]", track.title, item.publicUrl, audio.error);
      toast.error(`Não foi possível carregar o capítulo.${hint ? ` ${hint}` : ""}`);
      stopCurrentAudio();
      setCurrentPlaying(null);
      setCurrentTime(0);
      setDuration(0);
    };

    audio.onended = () => {
      saveChapterProgress(track.id, item.objectPath, 0);
      const tail = playbackTailRef.current;
      if (
        tail?.kind === "chapters" &&
        tail.trackId === track.id &&
        tail.index + 1 < tail.items.length
      ) {
        void playChapterAtIndex(track, tail.items, tail.index + 1);
        return;
      }
      playbackTailRef.current = null;
      setPlayingChapters(null);
      setCurrentPlaying(null);
      setCurrentTime(0);
      setDuration(0);
      setAudioElement(null);
    };

    audio.onloadedmetadata = () => {
      setDuration(audio.duration);
      const saved = getChapterProgress(track.id, item.objectPath);
      if (saved > 0 && saved < audio.duration) {
        audio.currentTime = saved;
        setCurrentTime(saved);
      } else {
        setCurrentTime(0);
      }
    };

    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
      saveChapterProgress(track.id, item.objectPath, audio.currentTime);
    };

    setAudioElement(audio);

    audio.play().catch((error: Error) => {
      if (error.name !== "AbortError") {
        console.error("Erro ao reproduzir áudio:", error);
        toast.error(`Erro ao reproduzir ${track.title} — capítulo ${item.chapter}`);
        stopCurrentAudio();
        setCurrentPlaying(null);
      }
    });
  };

  /** Faixa única (ficheiro .mp3 no caminho esperado ou `audio_url` com ficheiro). */
  const playLegacySingleTrack = async (track: AudioTrack, book: Book) => {
    const resolved = await resolveAudiosPlaybackUrl(track, book);
    if (!resolved) {
      toast.error(
        "Não foi possível montar o URL do áudio (vários capítulos na pasta — expande e escolhe o capítulo, ou confira VITE_SUPABASE_AUDIOS_PREFIX e audio_url).",
      );
      return;
    }

    const { publicUrl: src, objectPath } = resolved;

    if (audioElement && playbackTailRef.current) {
      const prev = playbackTailRef.current;
      if (prev.kind === "legacy") {
        saveLegacyProgress(prev.trackId, audioElement.currentTime);
      } else {
        const cur = prev.items[prev.index];
        if (cur) saveChapterProgress(prev.trackId, cur.objectPath, audioElement.currentTime);
      }
      stopCurrentAudio();
    }

    const ok = await probeSrc(src, objectPath);
    if (!ok) return;

    const audio = new Audio(src);
    playbackTailRef.current = { kind: "legacy", trackId: track.id };
    setPlayingChapters(null);
    setCurrentPlaying(track.id);

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
      stopCurrentAudio();
      setCurrentPlaying(null);
      setCurrentTime(0);
      setDuration(0);
    };

    audio.onended = () => {
      saveLegacyProgress(track.id, 0);
      playbackTailRef.current = null;
      setCurrentPlaying(null);
      setCurrentTime(0);
      setDuration(0);
      setAudioElement(null);
    };

    audio.onloadedmetadata = () => {
      setDuration(audio.duration);
      const savedTime = getLegacyProgress(track.id);
      if (savedTime > 0 && savedTime < audio.duration) {
        audio.currentTime = savedTime;
        setCurrentTime(savedTime);
      }
    };

    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
      saveLegacyProgress(track.id, audio.currentTime);
    };

    setAudioElement(audio);

    audio.play().catch((error: Error) => {
      if (error.name !== "AbortError") {
        console.error("Erro ao reproduzir áudio:", error);
        toast.error(`Erro ao reproduzir ${track.title}`);
        stopCurrentAudio();
        setCurrentPlaying(null);
      }
    });
  };

  const toggleExpandTrack = async (track: AudioTrack, book: Book) => {
    if (expandedTrackId === track.id) {
      setExpandedTrackId(null);
      return;
    }
    setExpandedTrackId(track.id);

    const root = getAudiosChapterRootDirectoryPath(track, book);
    if (root && !chapterCache.has(track.id)) {
      await ensureChapterListLoaded(track, book);
    }
  };

  const handleMainPlay = async (track: AudioTrack, book: Book) => {
    if (!audiosBuiltInPlaybackConfigured(track, book)) return;

    if (currentPlaying === track.id && audioElement) {
      if (playbackTailRef.current?.kind === "legacy") {
        saveLegacyProgress(track.id, audioElement.currentTime);
      } else if (playbackTailRef.current?.kind === "chapters") {
        const cur = playbackTailRef.current.items[playbackTailRef.current.index];
        if (cur) saveChapterProgress(track.id, cur.objectPath, audioElement.currentTime);
      }
      stopCurrentAudio();
      setCurrentPlaying(null);
      setCurrentTime(0);
      setDuration(0);
      return;
    }

    const chapterRoot = getAudiosChapterRootDirectoryPath(track, book);
    if (chapterRoot) {
      const list = await ensureChapterListLoaded(track, book);
      if (list.length > 1) {
        setExpandedTrackId(track.id);
        toast.message("Escolhe o capítulo abaixo.", { duration: 2500 });
        return;
      }
      if (list.length === 1) {
        await playChapterAtIndex(track, list, 0);
        return;
      }
    }

    await playLegacySingleTrack(track, book);
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
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const jumpToBookmarkTimestamp = (time: number) => {
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
                    audioTracks.filter((t) => audiosBuiltInPlaybackConfigured(t, books.get(t.book_id))).length
                  }{" "}
                  de {audioTracks.length} faixas com áudio configurado
                </p>
              </div>
            </div>
          </div>
          <ThemeToggle />
        </div>

        <div className="space-y-4">
          {audioTracks.length === 0 ? (
            <Card>
              <CardContent className="py-12 space-y-4 text-center px-4">
                <Volume2 className="w-12 h-12 mx-auto text-muted-foreground" />
                <p className="text-muted-foreground font-medium">Nenhuma faixa listada</p>
                <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
                  O app usa <code className="text-xs">books</code>, <code className="text-xs">audio_tracks</code> e o
                  bucket <code className="text-xs">audios</code>. Por livro: pasta{" "}
                  <code className="text-xs">Biblia/Velho ou Novo Testamento/NomeDoLivro/</code> com um MP3 por capítulo (
                  <code className="text-xs">01.mp3</code>, <code className="text-xs">Gn_001.mp3</code>, …) ou um único MP3 por livro (<code className="text-xs">Gn.mp3</code>).
                  Ver <code className="text-xs">.env.example</code>.
                </p>
              </CardContent>
            </Card>
          ) : (
            audioTracks.map((track) => {
              const book = books.get(track.book_id);
              const isExpanded = expandedTrackId === track.id;
              const chapterRoot = book ? getAudiosChapterRootDirectoryPath(track, book) : null;
              const chapterList = chapterCache.get(track.id);
              const isChapterBook = !!(chapterRoot && (chapterList?.length ?? 0) > 0);

              const isPlaying = currentPlaying === track.id && !!audioElement;
              const canPlay = book ? audiosBuiltInPlaybackConfigured(track, book) : false;

              const pc = playingChapters?.trackId === track.id ? playingChapters : null;

              return (
                <Card
                  key={track.id}
                  className={`transition-all ${isPlaying ? "border-primary border-2 shadow-lg" : ""}`}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2">
                      <div className="flex-1 min-w-0 flex items-start gap-1">
                        {chapterRoot ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 shrink-0 mt-0.5"
                            onClick={() => book && void toggleExpandTrack(track, book)}
                            aria-expanded={isExpanded}
                            aria-label={isExpanded ? "Fechar capítulos" : "Ver capítulos"}
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-5 h-5" />
                            ) : (
                              <ChevronRight className="w-5 h-5" />
                            )}
                          </Button>
                        ) : (
                          <span className="w-9 shrink-0" />
                        )}
                        <button
                          type="button"
                          className="text-left flex-1 min-w-0"
                          onClick={() => chapterRoot && book && void toggleExpandTrack(track, book)}
                          disabled={!chapterRoot || !book}
                        >
                          <div className="text-lg">{book?.name || track.title}</div>
                          {track.psalms_group !== "NONE" && (
                            <div className="text-sm font-normal text-muted-foreground">{track.title}</div>
                          )}
                          {chapterRoot && (
                            <div className="text-xs font-normal text-muted-foreground mt-1">
                              {chapterList?.length ? (
                                <>
                                  {chapterList.length} capítulo{chapterList.length !== 1 ? "s" : ""} no Storage
                                </>
                              ) : chapterLoadingTrackId === track.id ? (
                                <>A ler lista de capítulos…</>
                              ) : (
                                <>Áudio por capítulo nesta pasta — abre para listar.</>
                              )}
                            </div>
                          )}
                        </button>
                      </div>
                      <Button
                        size="icon"
                        variant={isPlaying ? "default" : "outline"}
                        onClick={() => book && void handleMainPlay(track, book)}
                        disabled={!canPlay}
                        aria-label={
                          chapterRoot && (chapterCache.get(track.id)?.length ?? 0) > 1 ? "Escolher capítulo" : "Reproduzir"
                        }
                      >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </Button>
                    </CardTitle>
                  </CardHeader>

                  {chapterRoot && book && isExpanded && (
                    <CardContent className="pt-0 pb-4 space-y-2 border-t mt-2">
                      {chapterLoadingTrackId === track.id && chapterList === undefined ? (
                        <p className="text-sm text-muted-foreground py-4">A carregar capítulos…</p>
                      ) : (chapterList?.length ?? 0) === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Sem ficheiros .mp3 nesta pasta. Para um único livro inteiro usa{" "}
                          <code className="text-xs">{getAudiosObjectPath(track, book) ?? "Gn.mp3"}</code>.
                        </p>
                      ) : (
                        <>
                          <p className="text-sm font-medium">Capítulos</p>
                          <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2 bc-scroll-y max-h-48 overflow-y-auto pr-1">
                            {chapterList!.map((ch, idx) => {
                              const chapterActive = !!(isPlaying && pc?.index === idx);
                              return (
                                <Button
                                  key={`${ch.objectPath}-${idx}`}
                                  variant={chapterActive ? "default" : "outline"}
                                  size="sm"
                                  className="h-9 text-xs px-1"
                                  onClick={() => void playChapterAtIndex(track, chapterList!, idx)}
                                >
                                  {ch.chapter}
                                </Button>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </CardContent>
                  )}

                  {isPlaying && (
                    <CardContent className="space-y-4 border-t">
                      <div className="space-y-2">
                        <Slider
                          value={[currentTime]}
                          max={duration || 1}
                          step={1}
                          onValueChange={handleSeek}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{formatTime(currentTime)}</span>
                          <span>
                            {pc?.items?.[pc.index] ? `Cap. ${pc.items[pc.index].chapter} · ` : ""}
                            {formatTime(duration)}
                          </span>
                        </div>
                      </div>

                      {!isChapterBook &&
                        track.chapter_timestamps &&
                        track.chapter_timestamps.length > 0 &&
                        playbackTailRef.current?.kind === "legacy" && (
                          <div className="border-t pt-3">
                            <p className="text-sm font-medium mb-2">Saltos na faixa (áudio único):</p>
                            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2 max-h-32 bc-scroll-y">
                              {track.chapter_timestamps.map((chapter) => (
                                <Button
                                  key={chapter.chapter}
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-xs"
                                  onClick={() => jumpToBookmarkTimestamp(chapter.time)}
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
                        Sem áudio configurado. Define <code className="text-xs">VITE_SUPABASE_AUDIOS_PREFIX=Biblia</code>
                        , coloca MP3 por capítulo na pasta do livro no Storage ou preenche{" "}
                        <code className="text-xs">audio_url</code> (pasta ou ficheiro).
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
