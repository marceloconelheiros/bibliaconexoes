-- Nome da pasta do livro no Storage (…/Biblia/{Testamento}/{audio_folder}/).
-- Se NULL, o cliente deriva de books.name sem diacríticos.

ALTER TABLE public.books
ADD COLUMN IF NOT EXISTS audio_folder text;

COMMENT ON COLUMN public.books.audio_folder IS 'Pasta exacta no bucket sob prefixo + Velho|Novo Testamento. NULL = usar nome do livro ASCII-folding no cliente.';
