-- Corrige URLs de áudio gravadas por engano com /rest/v1/object/ (API PostgREST)
-- em vez de /storage/v1/object/ (Storage público). Executar uma vez no SQL Editor.

UPDATE public.audio_tracks
SET audio_url = replace(audio_url, '/rest/v1/object/', '/storage/v1/object/')
WHERE audio_url IS NOT NULL
  AND audio_url LIKE '%/rest/v1/object/%';
