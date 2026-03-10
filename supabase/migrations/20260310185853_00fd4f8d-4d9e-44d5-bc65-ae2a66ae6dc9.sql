-- Table for AI-generated gallery images
CREATE TABLE public.generated_gallery_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  caption text NOT NULL,
  theme text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.generated_gallery_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view gallery images" ON public.generated_gallery_images
  FOR SELECT TO public USING (true);

CREATE POLICY "Service can insert gallery images" ON public.generated_gallery_images
  FOR INSERT TO public WITH CHECK (true);

-- Storage bucket for generated images
INSERT INTO storage.buckets (id, name, public) VALUES ('gallery-images', 'gallery-images', true);

CREATE POLICY "Anyone can view gallery bucket" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'gallery-images');

CREATE POLICY "Service can upload to gallery bucket" ON storage.objects
  FOR INSERT TO public WITH CHECK (bucket_id = 'gallery-images');
