-- Lock down internal helper functions: revoke EXECUTE from anon/authenticated.
-- These are used by RLS policies and triggers, never called from the client.
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Tighten session-based always-true INSERT/DELETE policies.
-- session_id is already NOT NULL, but we additionally enforce non-empty for defence in depth.
DROP POLICY IF EXISTS "Anyone can like quotes" ON public.quote_likes;
CREATE POLICY "Anyone can like quotes" ON public.quote_likes
  FOR INSERT TO anon, authenticated
  WITH CHECK (session_id IS NOT NULL AND length(session_id) BETWEEN 8 AND 128);

DROP POLICY IF EXISTS "Anyone can like stories" ON public.story_likes;
CREATE POLICY "Anyone can like stories" ON public.story_likes
  FOR INSERT TO anon, authenticated
  WITH CHECK (session_id IS NOT NULL AND length(session_id) BETWEEN 8 AND 128);

DROP POLICY IF EXISTS "Anyone can add favorites" ON public.favorites;
CREATE POLICY "Anyone can add favorites" ON public.favorites
  FOR INSERT TO anon, authenticated
  WITH CHECK (session_id IS NOT NULL AND length(session_id) BETWEEN 8 AND 128);

DROP POLICY IF EXISTS "Anyone can remove their favorites" ON public.favorites;
CREATE POLICY "Anyone can remove their favorites" ON public.favorites
  FOR DELETE TO anon, authenticated
  USING (session_id IS NOT NULL AND length(session_id) BETWEEN 8 AND 128);
