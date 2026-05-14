-- INSERT/UPDATE autenticados (JWT). Leitura pública mantém-se na migração anterior.
-- Dashboard / service_role continuam sem RLS quando usam a chave de serviço.

CREATE POLICY "Authenticated users can insert audio_track_chapter_sources"
  ON public.audio_track_chapter_sources FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update audio_track_chapter_sources"
  ON public.audio_track_chapter_sources FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
