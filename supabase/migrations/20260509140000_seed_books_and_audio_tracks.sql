-- Popula livros e faixas de áudio quando o banco está vazio (ex.: projeto novo na Vercel).
-- Idempotente: só insere se não houver linhas em books / audio_tracks.
-- MP3 no bucket `audios`: o app usa nome ASCII sem diacríticos (ex.: Êx→Ex.mp3, Jó→Job.mp3).

DO $$
BEGIN
  IF (SELECT COUNT(*)::int FROM public.books) > 0 THEN
    RETURN;
  END IF;

  INSERT INTO public.books (name, abbrev, testament, order_index, chapters_count) VALUES
    ('Gênesis', 'Gn', 'OT', 1, 50),
    ('Êxodo', 'Êx', 'OT', 2, 40),
    ('Levítico', 'Lv', 'OT', 3, 27),
    ('Números', 'Nm', 'OT', 4, 36),
    ('Deuteronômio', 'Dt', 'OT', 5, 34),
    ('Josué', 'Js', 'OT', 6, 24),
    ('Juízes', 'Jz', 'OT', 7, 21),
    ('Rute', 'Rt', 'OT', 8, 4),
    ('1 Samuel', '1Sm', 'OT', 9, 31),
    ('2 Samuel', '2Sm', 'OT', 10, 24),
    ('1 Reis', '1Rs', 'OT', 11, 22),
    ('2 Reis', '2Rs', 'OT', 12, 25),
    ('1 Crônicas', '1Cr', 'OT', 13, 29),
    ('2 Crônicas', '2Cr', 'OT', 14, 36),
    ('Esdras', 'Ed', 'OT', 15, 10),
    ('Neemias', 'Ne', 'OT', 16, 13),
    ('Ester', 'Et', 'OT', 17, 10),
    ('Jó', 'Jó', 'OT', 18, 42),
    ('Salmos', 'Sl', 'OT', 19, 150),
    ('Provérbios', 'Pv', 'OT', 20, 31),
    ('Eclesiastes', 'Ec', 'OT', 21, 12),
    ('Cântico dos Cânticos', 'Ct', 'OT', 22, 8),
    ('Isaías', 'Is', 'OT', 23, 66),
    ('Jeremias', 'Jr', 'OT', 24, 52),
    ('Lamentações', 'Lm', 'OT', 25, 5),
    ('Ezequiel', 'Ez', 'OT', 26, 48),
    ('Daniel', 'Dn', 'OT', 27, 12),
    ('Oséias', 'Os', 'OT', 28, 14),
    ('Joel', 'Jl', 'OT', 29, 3),
    ('Amós', 'Am', 'OT', 30, 9),
    ('Obadias', 'Ob', 'OT', 31, 1),
    ('Jonas', 'Jn', 'OT', 32, 4),
    ('Miquéias', 'Mq', 'OT', 33, 7),
    ('Naum', 'Na', 'OT', 34, 3),
    ('Habacuque', 'Hc', 'OT', 35, 3),
    ('Sofonias', 'Sf', 'OT', 36, 3),
    ('Ageu', 'Ag', 'OT', 37, 2),
    ('Zacarias', 'Zc', 'OT', 38, 14),
    ('Malaquias', 'Ml', 'OT', 39, 4),
    ('Mateus', 'Mt', 'NT', 40, 28),
    ('Marcos', 'Mc', 'NT', 41, 16),
    ('Lucas', 'Lc', 'NT', 42, 24),
    ('João', 'Jo', 'NT', 43, 21),
    ('Atos', 'At', 'NT', 44, 28),
    ('Romanos', 'Rm', 'NT', 45, 16),
    ('1 Coríntios', '1Co', 'NT', 46, 16),
    ('2 Coríntios', '2Co', 'NT', 47, 13),
    ('Gálatas', 'Gl', 'NT', 48, 6),
    ('Efésios', 'Ef', 'NT', 49, 6),
    ('Filipenses', 'Fp', 'NT', 50, 4),
    ('Colossenses', 'Cl', 'NT', 51, 4),
    ('1 Tessalonicenses', '1Ts', 'NT', 52, 5),
    ('2 Tessalonicenses', '2Ts', 'NT', 53, 3),
    ('1 Timóteo', '1Tn', 'NT', 54, 6),
    ('2 Timóteo', '2Tm', 'NT', 55, 4),
    ('Tito', 'Tt', 'NT', 56, 3),
    ('Filemom', 'Fm', 'NT', 57, 1),
    ('Hebreus', 'Hb', 'NT', 58, 13),
    ('Tiago', 'Tg', 'NT', 59, 5),
    ('1 Pedro', '1Pe', 'NT', 60, 5),
    ('2 Pedro', '2Pe', 'NT', 61, 3),
    ('1 João', '1Jo', 'NT', 62, 5),
    ('2 João', '2Jo', 'NT', 63, 1),
    ('3 João', '3Jo', 'NT', 64, 1),
    ('Judas', 'Jd', 'NT', 65, 1),
    ('Apocalipse', 'Ap', 'NT', 66, 22);
END $$;

DO $$
BEGIN
  IF (SELECT COUNT(*)::int FROM public.audio_tracks) > 0 THEN
    RETURN;
  END IF;
  IF (SELECT COUNT(*)::int FROM public.books) = 0 THEN
    RETURN;
  END IF;

  INSERT INTO public.audio_tracks (book_id, title, psalms_group)
  SELECT b.id, v.title, v.grp::public.psalms_group
  FROM public.books b
  CROSS JOIN (VALUES
    ('PS1', 'Salmos 1-41'),
    ('PS2', 'Salmos 42-72'),
    ('PS3', 'Salmos 73-89'),
    ('PS4', 'Salmos 90-106'),
    ('PS5', 'Salmos 107-150')
  ) AS v(grp, title)
  WHERE b.name = 'Salmos';

  INSERT INTO public.audio_tracks (book_id, title, psalms_group)
  SELECT id, name || ' (Áudio completo)', 'NONE'::public.psalms_group
  FROM public.books
  WHERE name <> 'Salmos';
END $$;
