-- 1. Lock down gallery-images storage uploads to service_role only
DROP POLICY IF EXISTS "Service can upload to gallery bucket" ON storage.objects;
CREATE POLICY "Service role can upload to gallery bucket"
  ON storage.objects
  FOR INSERT
  TO service_role
  WITH CHECK (bucket_id = 'gallery-images');

-- 2. Lock down inserts on generated_gallery_images to service_role only
DROP POLICY IF EXISTS "Service can insert gallery images" ON public.generated_gallery_images;
CREATE POLICY "Service role can insert gallery images"
  ON public.generated_gallery_images
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- 3. Lock down inserts on generated_quotes to service_role only
DROP POLICY IF EXISTS "Service role can insert quotes" ON public.generated_quotes;
CREATE POLICY "Service role can insert quotes"
  ON public.generated_quotes
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- 4. Lock down inserts on generated_stories to service_role only
DROP POLICY IF EXISTS "Service role can insert stories" ON public.generated_stories;
CREATE POLICY "Service role can insert stories"
  ON public.generated_stories
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- 5. Lock down inserts on daily_reflections to service_role only
DROP POLICY IF EXISTS "Service can insert daily reflections" ON public.daily_reflections;
CREATE POLICY "Service role can insert daily reflections"
  ON public.daily_reflections
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- 6. Restrict visitor_counter updates to increment-by-one only
DROP POLICY IF EXISTS "Anyone can update counter" ON public.visitor_counter;

CREATE OR REPLACE FUNCTION public.increment_visitor_counter()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_count bigint;
BEGIN
  UPDATE public.visitor_counter
    SET count = count + 1, updated_at = now()
    WHERE id = 1
  RETURNING count INTO new_count;
  RETURN new_count;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_visitor_counter() FROM public;
GRANT EXECUTE ON FUNCTION public.increment_visitor_counter() TO anon, authenticated;