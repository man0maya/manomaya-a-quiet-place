-- Create table for likes/favorites on quotes
CREATE TABLE public.quote_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id UUID NOT NULL REFERENCES public.generated_quotes(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(quote_id, session_id)
);

-- Create table for likes/favorites on stories
CREATE TABLE public.story_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.generated_stories(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(story_id, session_id)
);

-- Enable RLS
ALTER TABLE public.quote_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_likes ENABLE ROW LEVEL SECURITY;

-- Anyone can view likes count
CREATE POLICY "Anyone can view quote likes" ON public.quote_likes FOR SELECT USING (true);
CREATE POLICY "Anyone can view story likes" ON public.story_likes FOR SELECT USING (true);

-- Anyone can add likes (anonymous users via session_id)
CREATE POLICY "Anyone can like quotes" ON public.quote_likes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can like stories" ON public.story_likes FOR INSERT WITH CHECK (true);

-- Anyone can remove their own likes
CREATE POLICY "Anyone can unlike quotes" ON public.quote_likes FOR DELETE USING (true);
CREATE POLICY "Anyone can unlike stories" ON public.story_likes FOR DELETE USING (true);