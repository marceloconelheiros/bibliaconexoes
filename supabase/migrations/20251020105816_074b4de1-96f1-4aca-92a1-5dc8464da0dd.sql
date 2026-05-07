-- Insert 5 audio tracks for Psalms (Salmos)
WITH psalms_book AS (
  SELECT id FROM public.books WHERE name = 'Salmos'
),
psalm_groups AS (
  SELECT 
    unnest(ARRAY['PS1', 'PS2', 'PS3', 'PS4', 'PS5']) as grp,
    unnest(ARRAY['Salmos 1-41', 'Salmos 42-72', 'Salmos 73-89', 'Salmos 90-106', 'Salmos 107-150']) as title
)
INSERT INTO public.audio_tracks (book_id, title, psalms_group)
SELECT 
  psalms_book.id,
  psalm_groups.title,
  psalm_groups.grp::psalms_group
FROM psalms_book, psalm_groups;

-- Insert one audio track for each non-Psalm book
INSERT INTO public.audio_tracks (book_id, title, psalms_group)
SELECT id, name || ' (Áudio completo)', 'NONE'::psalms_group
FROM public.books
WHERE name != 'Salmos';