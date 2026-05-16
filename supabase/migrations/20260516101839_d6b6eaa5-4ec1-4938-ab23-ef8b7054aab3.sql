
-- 1. ai_reflections: remove broad SELECT and INSERT, add safe public function
DROP POLICY IF EXISTS "Anyone can view reflections" ON public.ai_reflections;
DROP POLICY IF EXISTS "Anyone can create reflections" ON public.ai_reflections;

-- Allow admins to view raw rows (for analytics)
CREATE POLICY "Admins can view all reflections"
  ON public.ai_reflections
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Service role inserts only (edge function uses service role)
CREATE POLICY "Service role can insert reflections"
  ON public.ai_reflections
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Public listing function that excludes the sensitive user_input column
CREATE OR REPLACE FUNCTION public.get_public_reflections(_limit int DEFAULT 50)
RETURNS TABLE (
  id uuid,
  quote text,
  explanation text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, quote, explanation, created_at
  FROM public.ai_reflections
  ORDER BY created_at DESC
  LIMIT GREATEST(1, LEAST(COALESCE(_limit, 50), 200));
$$;

REVOKE ALL ON FUNCTION public.get_public_reflections(int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_reflections(int) TO anon, authenticated;

-- 2. favorites: remove permissive DELETE, replace with RPC
DROP POLICY IF EXISTS "Anyone can remove their favorites" ON public.favorites;

CREATE OR REPLACE FUNCTION public.remove_favorite(_content_id uuid, _session_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _session_id IS NULL OR length(_session_id) < 8 OR length(_session_id) > 128 THEN
    RAISE EXCEPTION 'session_id required';
  END IF;
  DELETE FROM public.favorites
  WHERE content_id = _content_id
    AND session_id = _session_id;
END;
$$;

REVOKE ALL ON FUNCTION public.remove_favorite(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.remove_favorite(uuid, text) TO anon, authenticated;

-- 3. profiles: prevent users from changing role or id
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
  );
