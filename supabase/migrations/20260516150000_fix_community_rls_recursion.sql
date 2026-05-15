-- Corrige 42P17: recursão infinita em RLS na tabela community_members.
-- Executar no SQL Editor do Supabase se o feed/publicar ainda devolver 500.

CREATE OR REPLACE FUNCTION public.user_is_member_of(p_community_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ok boolean;
BEGIN
  PERFORM set_config('row_security', 'off', true);
  SELECT EXISTS (
    SELECT 1
    FROM public.community_members
    WHERE user_id = auth.uid()
      AND community_id = p_community_id
  ) INTO ok;
  RETURN COALESCE(ok, false);
END;
$$;

CREATE OR REPLACE FUNCTION public.user_has_any_community()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ok boolean;
BEGIN
  PERFORM set_config('row_security', 'off', true);
  SELECT EXISTS (
    SELECT 1
    FROM public.community_members
    WHERE user_id = auth.uid()
  ) INTO ok;
  RETURN COALESCE(ok, false);
END;
$$;

REVOKE ALL ON FUNCTION public.user_is_member_of(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.user_has_any_community() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_is_member_of(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_any_community() TO authenticated;

-- SELECT sem subconsulta à própria tabela (evita loop na política).
DROP POLICY IF EXISTS community_members_select ON public.community_members;
CREATE POLICY community_members_select
  ON public.community_members FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS posts_select_visible ON public.posts;
CREATE POLICY posts_select_visible
  ON public.posts FOR SELECT TO authenticated
  USING (
    author_id = auth.uid()
    OR (privacy = 'public' AND public.user_has_any_community())
    OR (privacy = 'community' AND public.user_is_member_of(community_id))
    OR (
      privacy = 'followers'
      AND EXISTS (
        SELECT 1
        FROM public.follows f
        WHERE f.follower_id = auth.uid()
          AND f.following_id = posts.author_id
      )
    )
  );

DROP POLICY IF EXISTS posts_insert_own ON public.posts;
CREATE POLICY posts_insert_own
  ON public.posts FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND public.user_is_member_of(community_id)
  );
