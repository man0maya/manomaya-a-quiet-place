import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import FeaturedQuote from "@/components/FeaturedQuote";
import FeaturedContent from "@/components/FeaturedContent";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";

const Index = () => {
  return (
    <>
      <SEOHead 
        title="Manomaya — Spiritual Quotes, Mindfulness & Inner Peace"
        description="Discover daily spiritual quotes, mindfulness reflections, and meditation wisdom. A sacred space for inner peace, self-discovery, and spiritual awakening. No ads, no trackers — just stillness."
        keywords="spirituality, spiritual quotes, mindfulness, meditation, inner peace, self-discovery, spiritual awakening, zen quotes, wisdom, consciousness, mindful living, soul quotes, peaceful mind, spiritual journey, enlightenment"
        canonicalUrl="https://manomaya.lovable.app/"
      />
      <main className="min-h-screen">
        <Navigation />
        <Hero />
        <FeaturedQuote />
        <FeaturedContent />
        <Footer />
      </main>
    </>
  );
};

export default Index;
