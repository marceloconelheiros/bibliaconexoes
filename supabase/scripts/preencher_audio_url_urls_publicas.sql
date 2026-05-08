-- Opcional: preenche audio_tracks.audio_url com o URL público esperado no Storage.
-- O app funciona com audio_url NULO (monta o mesmo caminho em tempo de execução).
-- Use este script só se quiser ver/editar URLs na tabela ou exportar relatórios.
--
-- 1) Copie o «Project URL» de Settings → API (ex.: https://abcdefgh.supabase.co)
-- 2) Substitua abaixo em audio_public_base (sem barra no fim)
-- 3) Se o bucket não for «audios», altere o segmento /public/NOME/
-- 4) SQL Editor → Run

CREATE EXTENSION IF NOT EXISTS unaccent;

DO $$
DECLARE
  audio_public_base text := 'https://SUBSTITUA_PELO_REF.supabase.co/storage/v1/object/public/audios';
BEGIN
  IF audio_public_base LIKE '%SUBSTITUA%' THEN
    RAISE EXCEPTION 'Edite audio_public_base com o URL do teu projeto antes de executar.';
  END IF;

  UPDATE public.audio_tracks t
  SET audio_url = audio_public_base || '/' ||
    CASE
      WHEN s.grp ~ '^PS[1-5]$' THEN s.slug || '_' || s.grp || '.mp3'
      ELSE s.slug || '.mp3'
    END
  FROM (
    SELECT
      t2.id AS tid,
      CASE
        WHEN trim(b.abbrev) = 'Jó' THEN 'Job'
        ELSE regexp_replace(unaccent(trim(b.abbrev)), '[^a-zA-Z0-9]', '', 'g')
      END AS slug,
      t2.psalms_group::text AS grp
    FROM public.audio_tracks t2
    INNER JOIN public.books b ON b.id = t2.book_id
  ) s
  WHERE t.id = s.tid
    AND length(s.slug) > 0
    AND coalesce(nullif(trim(t.audio_url), ''), '') = '';
END $$;
