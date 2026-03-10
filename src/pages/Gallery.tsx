import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, RefreshCw, ImageIcon } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

import gallery1 from "@/assets/gallery-1.jpg";
import gallery2 from "@/assets/gallery-2.jpg";
import gallery3 from "@/assets/gallery-3.jpg";
import gallery4 from "@/assets/gallery-4.jpg";

const staticImages = [
  { src: gallery1, caption: "Golden lotus on still waters", alt: "Golden lotus floating on misty water" },
  { src: gallery2, caption: "Path to inner peace", alt: "Ancient temple path through mist" },
  { src: gallery3, caption: "Light in the darkness", alt: "Meditation candle flame" },
  { src: gallery4, caption: "Mountain awakening", alt: "Sunrise meditation in mountains" },
];

interface GeneratedImage {
  id: string;
  image_url: string;
  caption: string;
  theme: string;
  created_at: string;
}

const Gallery = () => {
  const [selected, setSelected] = useState<{ src: string; caption: string; alt: string } | null>(null);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingImages, setIsLoadingImages] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchGeneratedImages();
  }, []);

  const fetchGeneratedImages = async () => {
    try {
      const { data, error } = await supabase
        .from("generated_gallery_images")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (!error && data) setGeneratedImages(data as GeneratedImage[]);
    } catch (err) {
      console.error("Error fetching generated images:", err);
    } finally {
      setIsLoadingImages(false);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-gallery-image");
      if (error) throw error;
      if (data?.generated) {
        setGeneratedImages((prev) => [data, ...prev]);
        toast({ title: "New image created", description: data.caption?.substring(0, 80) });
      } else if (data?.message) {
        toast({ title: "Limit reached", description: data.message });
      }
    } catch (err) {
      console.error("Generate error:", err);
      toast({ title: "Could not generate image", description: "Please try again later.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const allImages = [
    ...generatedImages.map((g) => ({
      src: g.image_url,
      caption: g.caption,
      alt: g.theme || g.caption,
      isGenerated: true,
    })),
    ...staticImages.map((s) => ({ ...s, isGenerated: false })),
  ];

  return (
    <>
      <SEOHead
        title="Spiritual Gallery — Meditation & Mindfulness Images"
        description="Browse our curated gallery of spiritual and meditative images, including AI-generated spiritual art."
        keywords="spiritual images, meditation gallery, mindfulness pictures, AI art, contemplative art"
        canonicalUrl="https://manomaya.lovable.app/gallery"
      />
      <main className="min-h-screen section-teal">
        <Navigation />

        {/* Header */}
        <section className="pt-32 pb-12 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-4xl md:text-6xl font-serif text-foreground mb-6"
            >
              Gallery
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-muted-foreground text-lg"
            >
              A sanctuary of images for quiet reflection
            </motion.p>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="divider-gold w-24 mx-auto mt-8"
            />
          </div>
        </section>

        {/* Generate Button */}
        <section className="px-6 pb-8">
          <div className="max-w-6xl mx-auto flex justify-center">
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              onClick={handleGenerate}
              disabled={isGenerating}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all duration-300 disabled:opacity-50"
            >
              {isGenerating ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">
                {isGenerating ? "Creating spiritual art..." : "Generate Spiritual Image"}
              </span>
            </motion.button>
          </div>
        </section>

        {/* Gallery Grid */}
        <section className="px-6 pb-24">
          <div className="max-w-6xl mx-auto">
            {isLoadingImages ? (
              <div className="text-center py-20">
                <ImageIcon className="w-8 h-8 mx-auto text-primary/40 animate-pulse" />
                <p className="text-muted-foreground mt-4 text-sm">Loading gallery...</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                  {allImages.map((image, index) => (
                    <motion.div
                      key={image.src}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5, delay: Math.min(index * 0.05, 0.4) }}
                      onClick={() => setSelected(image)}
                      className="group cursor-pointer"
                      layout
                    >
                      <div className="relative overflow-hidden rounded-lg card-shadow">
                        <img
                          src={image.src}
                          alt={image.alt}
                          loading="lazy"
                          decoding="async"
                          className="w-full aspect-square object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        {image.isGenerated && (
                          <div className="absolute top-3 right-3">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/80 text-primary-foreground text-[10px] font-medium backdrop-blur-sm">
                              <Sparkles className="w-2.5 h-2.5" /> AI
                            </span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-teal-darker/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                          <p className="text-cream text-xs font-light tracking-wide line-clamp-2">
                            {image.caption}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </section>

        {/* Lightbox */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
              className="fixed inset-0 z-50 bg-teal-darker/95 backdrop-blur-md flex items-center justify-center p-6"
            >
              <button
                onClick={() => setSelected(null)}
                className="absolute top-6 right-6 text-foreground/60 hover:text-primary transition-colors"
              >
                <X size={32} />
              </button>
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="max-w-4xl max-h-[80vh]"
              >
                <img
                  src={selected.src}
                  alt={selected.alt}
                  className="w-full h-full object-contain rounded-lg"
                />
                <p className="text-center text-cream-muted mt-4 text-sm tracking-wide">
                  {selected.caption}
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <Footer />
      </main>
    </>
  );
};

export default Gallery;
