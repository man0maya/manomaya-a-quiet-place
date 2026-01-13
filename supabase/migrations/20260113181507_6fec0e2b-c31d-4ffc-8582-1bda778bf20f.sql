-- Create table for AI-generated quotes
CREATE TABLE public.generated_quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  text TEXT NOT NULL,
  author TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for AI-generated stories
CREATE TABLE public.generated_stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  read_time TEXT NOT NULL DEFAULT '5 min read',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.generated_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_stories ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read quotes and stories (public content)
CREATE POLICY "Anyone can view quotes"
  ON public.generated_quotes
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view stories"
  ON public.generated_stories
  FOR SELECT
  USING (true);

-- Allow inserting via edge functions (service role)
CREATE POLICY "Service role can insert quotes"
  ON public.generated_quotes
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can insert stories"
  ON public.generated_stories
  FOR INSERT
  WITH CHECK (true);

-- Create indexes for faster queries
CREATE INDEX idx_quotes_created_at ON public.generated_quotes(created_at DESC);
CREATE INDEX idx_stories_created_at ON public.generated_stories(created_at DESC);