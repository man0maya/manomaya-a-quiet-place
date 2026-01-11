import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import FeaturedQuote from "@/components/FeaturedQuote";
import FeaturedContent from "@/components/FeaturedContent";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <main className="min-h-screen">
      <Navigation />
      <Hero />
      <FeaturedQuote />
      <FeaturedContent />
      <Footer />
    </main>
  );
};

export default Index;
