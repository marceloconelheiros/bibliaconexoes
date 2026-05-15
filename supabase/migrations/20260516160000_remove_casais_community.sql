-- Remove subcomunidade Casais (membros e posts em cascata).

DELETE FROM public.communities
WHERE slug = 'casais';
