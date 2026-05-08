-- Projeto criado no Dashboard com bucket privado, ou migração inicial falhou ao duplicar bucket:
-- garante bucket **audios** público e política de leitura anónima.

INSERT INTO storage.buckets (id, name, public)
VALUES ('audios', 'audios', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

DROP POLICY IF EXISTS "Anyone can view audios" ON storage.objects;

CREATE POLICY "Anyone can view audios"
ON storage.objects
FOR SELECT
USING (bucket_id = 'audios');
