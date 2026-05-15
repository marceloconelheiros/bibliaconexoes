-- Rede v1: casa (Geral) + subcomunidades, posts com privacidade, seguir, feed cronológico.

CREATE TYPE public.post_privacy AS ENUM ('public', 'community', 'followers');

CREATE TABLE public.communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.community_members (
  community_id UUID NOT NULL REFERENCES public.communities (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (community_id, user_id)
);

CREATE TABLE public.follows (
  follower_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CONSTRAINT follows_no_self CHECK (follower_id <> following_id)
);

CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  community_id UUID NOT NULL REFERENCES public.communities (id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (char_length(trim(body)) >= 1 AND char_length(body) <= 4000),
  privacy public.post_privacy NOT NULL DEFAULT 'community',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX posts_community_created_idx ON public.posts (community_id, created_at DESC);
CREATE INDEX posts_author_created_idx ON public.posts (author_id, created_at DESC);
CREATE INDEX community_members_user_idx ON public.community_members (user_id);
CREATE INDEX follows_following_idx ON public.follows (following_id);

-- Comunidade-mãe + subcomunidades iniciais
INSERT INTO public.communities (slug, name, description, is_default, sort_order) VALUES
  ('geral', 'Geral', 'Toda a casa Bíblia Conexões — o ponto de encontro principal.', true, 0),
  ('lideres', 'Líderes e empresários', 'Gestão, ética e decisão com base na Palavra.', false, 10),
  ('jovens', 'Jovens na fé', 'Crescimento e comunhão para quem está começando ou retomando.', false, 20),
  ('casais', 'Casais', 'Vida a dois com propósito e alinhamento espiritual.', false, 30),
  ('oracao', 'Oração e intercessão', 'Pedidos, gratidão e apoio mútuo em oração.', false, 40)
ON CONFLICT (slug) DO NOTHING;

-- Entrada automática na comunidade Geral
CREATE OR REPLACE FUNCTION public.join_default_community()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  geral_id UUID;
BEGIN
  SELECT id INTO geral_id FROM public.communities WHERE slug = 'geral' LIMIT 1;
  IF geral_id IS NOT NULL THEN
    INSERT INTO public.community_members (community_id, user_id)
    VALUES (geral_id, NEW.id)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_join_geral ON public.profiles;
CREATE TRIGGER profiles_join_geral
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.join_default_community();

-- Utilizadores já existentes: entrar no Geral (idempotente)
INSERT INTO public.community_members (community_id, user_id)
SELECT c.id, p.id
FROM public.communities c
CROSS JOIN public.profiles p
WHERE c.slug = 'geral'
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.set_posts_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS posts_set_updated_at ON public.posts;
CREATE TRIGGER posts_set_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.set_posts_updated_at();

ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Comunidades: leitura para autenticados
DROP POLICY IF EXISTS communities_select_authenticated ON public.communities;
CREATE POLICY communities_select_authenticated
  ON public.communities FOR SELECT TO authenticated
  USING (true);

-- Membros: ver membros das comunidades em que estou; inserir-me; sair de mim
DROP POLICY IF EXISTS community_members_select ON public.community_members;
CREATE POLICY community_members_select
  ON public.community_members FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR community_id IN (
      SELECT cm.community_id FROM public.community_members cm WHERE cm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS community_members_insert_own ON public.community_members;
CREATE POLICY community_members_insert_own
  ON public.community_members FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS community_members_delete_own ON public.community_members;
CREATE POLICY community_members_delete_own
  ON public.community_members FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Seguir
DROP POLICY IF EXISTS follows_select ON public.follows;
CREATE POLICY follows_select
  ON public.follows FOR SELECT TO authenticated
  USING (follower_id = auth.uid() OR following_id = auth.uid());

DROP POLICY IF EXISTS follows_insert_own ON public.follows;
CREATE POLICY follows_insert_own
  ON public.follows FOR INSERT TO authenticated
  WITH CHECK (follower_id = auth.uid());

DROP POLICY IF EXISTS follows_delete_own ON public.follows;
CREATE POLICY follows_delete_own
  ON public.follows FOR DELETE TO authenticated
  USING (follower_id = auth.uid());

-- Posts: visibilidade por privacidade
DROP POLICY IF EXISTS posts_select_visible ON public.posts;
CREATE POLICY posts_select_visible
  ON public.posts FOR SELECT TO authenticated
  USING (
    author_id = auth.uid()
    OR (
      privacy = 'public'
      AND EXISTS (SELECT 1 FROM public.community_members cm WHERE cm.user_id = auth.uid())
    )
    OR (
      privacy = 'community'
      AND EXISTS (
        SELECT 1 FROM public.community_members cm
        WHERE cm.user_id = auth.uid() AND cm.community_id = posts.community_id
      )
    )
    OR (
      privacy = 'followers'
      AND EXISTS (
        SELECT 1 FROM public.follows f
        WHERE f.follower_id = auth.uid() AND f.following_id = posts.author_id
      )
    )
  );

DROP POLICY IF EXISTS posts_insert_own ON public.posts;
CREATE POLICY posts_insert_own
  ON public.posts FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.community_members cm
      WHERE cm.user_id = auth.uid() AND cm.community_id = posts.community_id
    )
  );

DROP POLICY IF EXISTS posts_update_own ON public.posts;
CREATE POLICY posts_update_own
  ON public.posts FOR UPDATE TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

DROP POLICY IF EXISTS posts_delete_own ON public.posts;
CREATE POLICY posts_delete_own
  ON public.posts FOR DELETE TO authenticated
  USING (author_id = auth.uid());

-- Perfis: leitura entre utilizadores autenticados (feed e rostos)
DROP POLICY IF EXISTS profiles_select_authenticated ON public.profiles;
CREATE POLICY profiles_select_authenticated
  ON public.profiles FOR SELECT TO authenticated
  USING (true);
