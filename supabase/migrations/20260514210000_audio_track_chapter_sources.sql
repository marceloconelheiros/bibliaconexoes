-- Um caminho ou URL público Supabase Storage por capítulo e por linha em `audio_tracks`
-- (ex.: Biblia/Velho Testamento/Genesis/01.mp3 ou URL completa do objecto).

CREATE TABLE public.audio_track_chapter_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audio_track_id uuid NOT NULL REFERENCES public.audio_tracks(id) ON DELETE CASCADE,
  chapter integer NOT NULL CHECK (chapter >= 1),
  object_path_or_url text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (audio_track_id, chapter)
);

CREATE INDEX idx_audio_track_chapter_sources_track ON public.audio_track_chapter_sources (audio_track_id);

COMMENT ON TABLE public.audio_track_chapter_sources IS 'Endereço do MP3 por capítulo (`object_path_or_url`), por faixa de áudio.';

ALTER TABLE public.audio_track_chapter_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view audio track chapter sources"
  ON public.audio_track_chapter_sources FOR SELECT
  USING (true);
