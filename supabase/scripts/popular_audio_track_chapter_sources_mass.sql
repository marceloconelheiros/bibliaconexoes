-- =====================================================================
-- Preencher em massa public.audio_track_chapter_sources (caminhos no bucket «audios»).
-- Executar no Supabase → SQL Editor (não executar types.ts / ficheiros .ts).
-- Comenta ou apaga um dos blocos A) ou B) se só quiseres esse modo — o ficheiro corre os dois por omissão.
--
-- Requisitos:
-- - Já existem linhas em books + audio_tracks (faixa com psalms_group = NONE por livro).
-- - Preferir books.audio_folder = nome da pasta exacta no Storage (ex.: Genesis).
-- =====================================================================

-- =====================================================================
-- A) UM LIVRO — edita as variáveis e executa apenas este DO $$ … $$
-- =====================================================================
DO $$
DECLARE
  v_book_name constant text := 'Gênesis'; -- igual a public.books.name
  v_path_prefix constant text := 'Biblia/Velho Testamento/Genesis/';
  -- sufixos: 01.mp3 → v_digits:=2 ; 001.mp3 → 3 ; cap_05.mp3 → v_pattern 'cap'
  v_digits constant int := 2;
BEGIN
  INSERT INTO public.audio_track_chapter_sources (audio_track_id, chapter, object_path_or_url)
  SELECT
    t.id,
    gs.chapter,
    v_path_prefix || lpad(gs.chapter::text, v_digits, '0') || '.mp3'
  FROM public.books b
  INNER JOIN LATERAL (
    SELECT tr.id FROM public.audio_tracks tr
    WHERE tr.book_id = b.id AND tr.psalms_group::text = 'NONE'
    ORDER BY tr.created_at ASC NULLS LAST, tr.id ASC
    LIMIT 1
  ) t ON true
  CROSS JOIN LATERAL generate_series(1, b.chapters_count) AS gs(chapter)
  WHERE trim(b.name) = v_book_name
  ON CONFLICT (audio_track_id, chapter)
  DO UPDATE SET object_path_or_url = EXCLUDED.object_path_or_url;
END $$;

-- =====================================================================
-- B) EM MASSA — todos os livros com books.audio_folder preenchido + faixa NONE
--    Caminho:
--    Biblia/{Velho Testamento|Novo Testamento}/{audio_folder}/{NN}.mp3
-- =====================================================================
DO $$
DECLARE
  v_digits constant int := 2;
  v_prefix constant text := 'Biblia';
BEGIN
  INSERT INTO public.audio_track_chapter_sources (audio_track_id, chapter, object_path_or_url)
  SELECT
    t.id,
    gs.chapter,
    v_prefix
      || '/' || CASE
        WHEN b.testament::text = 'NT' THEN 'Novo Testamento'
        ELSE 'Velho Testamento'
      END
      || '/' || trim(b.audio_folder)
      || '/' || lpad(gs.chapter::text, v_digits, '0') || '.mp3'
  FROM public.books b
  INNER JOIN LATERAL (
    SELECT tr.id FROM public.audio_tracks tr
    WHERE tr.book_id = b.id AND tr.psalms_group::text = 'NONE'
    ORDER BY tr.created_at ASC NULLS LAST, tr.id ASC
    LIMIT 1
  ) t ON true
  CROSS JOIN LATERAL generate_series(1, b.chapters_count) AS gs(chapter)
  WHERE b.audio_folder IS NOT NULL
    AND trim(b.audio_folder) <> ''
  ON CONFLICT (audio_track_id, chapter)
  DO UPDATE SET object_path_or_url = EXCLUDED.object_path_or_url;
END $$;

-- =====================================================================
-- C) OPCIONAL — sincronizar audio_folder com pastas típicas do Storage (sem acentos)
--    Só actualiza books SEM audio_folder; nomes alinhados ao bucket (Genesis, Exodo, …).
--    Descomenta se precisares antes do bloco B).
-- =====================================================================
/*
UPDATE public.books b
SET audio_folder = v.target
FROM (VALUES
  ('Gênesis', 'Genesis'),
  ('Êxodo', 'Exodo'),
  ('Levítico', 'Levitico'),
  ('Números', 'Numeros'),
  ('Deuteronômio', 'Deuteronomio'),
  ('Josué', 'Josue'),
  ('Juízes', 'Juizes'),
  ('Rute', 'Rute'),
  ('1 Samuel', '1 Samuel'),
  ('2 Samuel', '2 Samuel'),
  ('1 Reis', '1 Reis'),
  ('2 Reis', '2 Reis'),
  ('1 Crônicas', '1 Cronicas'),
  ('2 Crônicas', '2 Cronicas'),
  ('Esdras', 'Esdras'),
  ('Neemias', 'Neemias'),
  ('Ester', 'Ester'),
  ('Jó', 'Jo'),
  ('Salmos', 'Salmos'),
  ('Provérbios', 'Proverbios'),
  ('Eclesiastes', 'Eclesiastes'),
  ('Cântico dos Cânticos', 'Cantares de Salomao'),
  ('Isaías', 'Isaias'),
  ('Jeremias', 'Jeremias'),
  ('Lamentações', 'Lamentacoes'),
  ('Ezequiel', 'Ezequiel'),
  ('Daniel', 'Daniel'),
  ('Oséias', 'Oseias'),
  ('Joel', 'Joel'),
  ('Amós', 'Amos'),
  ('Obadias', 'Obadias'),
  ('Jonas', 'Jonas'),
  ('Miquéias', 'Miqueias'),
  ('Naum', 'Naum'),
  ('Habacuque', 'Habacuque'),
  ('Sofonias', 'Sofonias'),
  ('Ageu', 'Ageu'),
  ('Zacarias', 'Zacarias'),
  ('Malaquias', 'Malaquias'),
  ('Mateus', 'Mateus'),
  ('Marcos', 'Marcos'),
  ('Lucas', 'Lucas'),
  ('João', 'Joao'),
  ('Atos', 'Atos'),
  ('Romanos', 'Romanos'),
  ('1 Coríntios', '1 Corintios'),
  ('2 Coríntios', '2 Corintios'),
  ('Gálatas', 'Galatas'),
  ('Efésios', 'Efesios'),
  ('Filipenses', 'Filipenses'),
  ('Colossenses', 'Colossenses'),
  ('1 Tessalonicenses', '1 Tessalonicenses'),
  ('2 Tessalonicenses', '2 Tessalonicenses'),
  ('1 Timóteo', '1 Timoteo'),
  ('2 Timóteo', '2 Timoteo'),
  ('Tito', 'Tito'),
  ('Filemom', 'Filemom'),
  ('Hebreus', 'Hebreus'),
  ('Tiago', 'Tiago'),
  ('1 Pedro', '1 Pedro'),
  ('2 Pedro', '2 Pedro'),
  ('1 João', '1 Joao'),
  ('2 João', '2 Joao'),
  ('3 João', '3 Joao'),
  ('Judas', 'Judas'),
  ('Apocalipse', 'Apocalipse')
) AS v(name_pt, target)
WHERE trim(b.name) = v.name_pt
  AND (b.audio_folder IS NULL OR trim(b.audio_folder) = '');
*/
