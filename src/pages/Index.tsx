import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import DailyReflection from "@/components/DailyReflection";
import FeaturedContent from "@/components/FeaturedContent";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";

const Index = () => {
  return (
    <>
      <SEOHead 
        title="Manomaya — Spiritual Reflections & Inner Peace"
        description="Discover daily spiritual reflections, mindfulness wisdom, and AI-powered contemplations. A sacred space for inner peace and self-discovery. No ads, no trackers — just stillness."
        keywords="spirituality, spiritual quotes, mindfulness, meditation, inner peace, self-discovery, spiritual awakening, zen quotes, wisdom, consciousness, mindful living, soul quotes, peaceful mind, spiritual journey, enlightenment"
        canonicalUrl="https://manomaya.lovable.app/"
      />
      <main className="min-h-screen">
        <Navigation />
        <Hero />
        
        {/* Daily Reflection Section */}
        <section className="section-teal py-24 px-6">
          <div className="max-w-3xl mx-auto">
            <DailyReflection />
          </div>
        </section>
        
        <FeaturedContent />
        <Footer />
      </main>
    </>
  );
};

export default Index;
