-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table for role checking
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  )
$$;

-- RLS policies for profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

-- RLS policies for user_roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.is_admin());

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'user'
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create stories table (enhanced version)
CREATE TABLE public.stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  image_url TEXT,
  video_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  read_time TEXT DEFAULT '5 min read',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create quotes table (enhanced version)
CREATE TABLE public.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  author TEXT NOT NULL,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on stories and quotes
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Anyone can view active stories"
  ON public.stories FOR SELECT
  USING (is_active = true);

CREATE POLICY "Anyone can view active quotes"
  ON public.quotes FOR SELECT
  USING (is_active = true);

-- Admin policies for stories
CREATE POLICY "Admins can view all stories"
  ON public.stories FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can insert stories"
  ON public.stories FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update stories"
  ON public.stories FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete stories"
  ON public.stories FOR DELETE
  USING (public.is_admin());

-- Admin policies for quotes
CREATE POLICY "Admins can view all quotes"
  ON public.quotes FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can insert quotes"
  ON public.quotes FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update quotes"
  ON public.quotes FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete quotes"
  ON public.quotes FOR DELETE
  USING (public.is_admin());

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stories_updated_at
  BEFORE UPDATE ON public.stories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage buckets for images
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('stories-images', 'stories-images', true),
  ('quotes-images', 'quotes-images', true);

-- Storage policies for stories-images
CREATE POLICY "Anyone can view story images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'stories-images');

CREATE POLICY "Admins can upload story images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'stories-images' AND public.is_admin());

CREATE POLICY "Admins can update story images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'stories-images' AND public.is_admin());

CREATE POLICY "Admins can delete story images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'stories-images' AND public.is_admin());

-- Storage policies for quotes-images
CREATE POLICY "Anyone can view quote images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'quotes-images');

CREATE POLICY "Admins can upload quote images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'quotes-images' AND public.is_admin());

CREATE POLICY "Admins can update quote images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'quotes-images' AND public.is_admin());

CREATE POLICY "Admins can delete quote images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'quotes-images' AND public.is_admin());