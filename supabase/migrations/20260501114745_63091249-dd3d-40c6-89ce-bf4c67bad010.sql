
-- Drop overly permissive DELETE policies
DROP POLICY IF EXISTS "Anyone can unlike quotes" ON public.quote_likes;
DROP POLICY IF EXISTS "Anyone can unlike stories" ON public.story_likes;

-- Session-scoped unlike functions (SECURITY DEFINER so they bypass RLS while
-- enforcing the session_id match in their own WHERE clause)
CREATE OR REPLACE FUNCTION public.unlike_quote(_quote_id uuid, _session_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _session_id IS NULL OR length(_session_id) = 0 THEN
    RAISE EXCEPTION 'session_id required';
  END IF;
  DELETE FROM public.quote_likes
  WHERE quote_id = _quote_id
    AND session_id = _session_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.unlike_story(_story_id uuid, _session_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _session_id IS NULL OR length(_session_id) = 0 THEN
    RAISE EXCEPTION 'session_id required';
  END IF;
  DELETE FROM public.story_likes
  WHERE story_id = _story_id
    AND session_id = _session_id;
END;
$$;

REVOKE ALL ON FUNCTION public.unlike_quote(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.unlike_story(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.unlike_quote(uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.unlike_story(uuid, text) TO anon, authenticated;
