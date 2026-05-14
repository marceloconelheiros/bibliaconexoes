-- Alinha livro ao nome da pasta no Storage público (`…/Biblia/{Testamento}/Cantares de Salomao`).
UPDATE public.books
SET audio_folder = 'Cantares de Salomao'
WHERE name = 'Cântico dos Cânticos'
  AND (audio_folder IS NULL OR trim(audio_folder) = '');
