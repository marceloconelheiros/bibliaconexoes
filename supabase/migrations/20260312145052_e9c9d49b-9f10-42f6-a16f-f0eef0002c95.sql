INSERT INTO storage.buckets (id, name, public) VALUES ('audios', 'audios', true);

CREATE POLICY "Anyone can view audios" ON storage.objects FOR SELECT USING (bucket_id = 'audios');