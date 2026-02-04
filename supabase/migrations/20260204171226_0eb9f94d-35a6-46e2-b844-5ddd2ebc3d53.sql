
-- Create posts table for admin notes/blog posts
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'scheduled')),
  scheduled_for TIMESTAMPTZ,
  display_order INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ
);

-- Create ai_reflections table for user-generated AI content
CREATE TABLE IF NOT EXISTS public.ai_reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_input TEXT NOT NULL,
  quote TEXT NOT NULL,
  explanation TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  session_id TEXT
);

-- Create favorites table for users to save content
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL CHECK (content_type IN ('post', 'reflection')),
  content_id UUID NOT NULL,
  session_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(content_type, content_id, session_id)
);

-- Create daily_reflection table for auto-generated daily quotes
CREATE TABLE IF NOT EXISTS public.daily_reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote TEXT NOT NULL,
  explanation TEXT NOT NULL,
  date DATE NOT NULL UNIQUE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_reflections ENABLE ROW LEVEL SECURITY;

-- Posts policies
CREATE POLICY "Anyone can view published posts" ON public.posts
  FOR SELECT USING (status = 'published' AND (scheduled_for IS NULL OR scheduled_for <= now()));

CREATE POLICY "Admins can view all posts" ON public.posts
  FOR SELECT USING (is_admin());

CREATE POLICY "Admins can insert posts" ON public.posts
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins can update posts" ON public.posts
  FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can delete posts" ON public.posts
  FOR DELETE USING (is_admin());

-- AI reflections policies (anyone can create and view)
CREATE POLICY "Anyone can view reflections" ON public.ai_reflections
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create reflections" ON public.ai_reflections
  FOR INSERT WITH CHECK (true);

-- Favorites policies
CREATE POLICY "Anyone can view favorites" ON public.favorites
  FOR SELECT USING (true);

CREATE POLICY "Anyone can add favorites" ON public.favorites
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can remove their favorites" ON public.favorites
  FOR DELETE USING (true);

-- Daily reflections policies
CREATE POLICY "Anyone can view daily reflections" ON public.daily_reflections
  FOR SELECT USING (true);

CREATE POLICY "Service can insert daily reflections" ON public.daily_reflections
  FOR INSERT WITH CHECK (true);

-- Add trigger for updated_at on posts
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for scheduled posts
CREATE INDEX idx_posts_scheduled ON public.posts (scheduled_for) WHERE status = 'scheduled';
CREATE INDEX idx_posts_status ON public.posts (status);
CREATE INDEX idx_daily_reflections_date ON public.daily_reflections (date);
