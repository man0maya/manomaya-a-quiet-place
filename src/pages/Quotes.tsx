import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Sparkles, Clock } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { useAIContent, GeneratedQuote } from "@/hooks/useAIContent";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

const staticQuotes = [
  {
    text: "The soul always knows what to do to heal itself. The challenge is to silence the mind.",
    author: "Caroline Myss",
  },
  {
    text: "In the midst of movement and chaos, keep stillness inside of you.",
    author: "Deepak Chopra",
  },
  {
    text: "The present moment is filled with joy and happiness. If you are attentive, you will see it.",
    author: "Thich Nhat Hanh",
  },
  {
    text: "Silence is the sleep that nourishes wisdom.",
    author: "Francis Bacon",
  },
  {
    text: "Within you there is a stillness and a sanctuary to which you can retreat at any time.",
    author: "Hermann Hesse",
  },
  {
    text: "The quieter you become, the more you can hear.",
    author: "Ram Dass",
  },
  {
    text: "Be like a tree and let the dead leaves drop.",
    author: "Rumi",
  },
  {
    text: "Nature does not hurry, yet everything is accomplished.",
    author: "Lao Tzu",
  },
];

const Quotes = () => {
  const [savedQuotes, setSavedQuotes] = useState<GeneratedQuote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { generateQuote, fetchSavedQuotes, isGeneratingQuote } = useAIContent();

  // Fetch saved quotes on mount
  useEffect(() => {
    const loadQuotes = async () => {
      setIsLoading(true);
      const quotes = await fetchSavedQuotes();
      setSavedQuotes(quotes);
      setIsLoading(false);
    };
    loadQuotes();
  }, [fetchSavedQuotes]);

  const handleGenerateNew = async () => {
    const quote = await generateQuote();
    if (quote) {
      // Add to the beginning of saved quotes
      setSavedQuotes(prev => [quote, ...prev]);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    return format(new Date(dateString), "MMM d, yyyy 'at' h:mm a");
  };

  return (
    <>
      <SEOHead 
        title="Spiritual Quotes for Mindfulness & Inner Peace"
        description="Explore curated spiritual quotes from Buddhist, Hindu, Sufi, Zen, and Taoist traditions. Daily wisdom for meditation, mindfulness, and spiritual awakening."
        keywords="spiritual quotes, mindfulness quotes, meditation quotes, zen quotes, Rumi quotes, Lao Tzu, Ram Dass, inner peace quotes, wisdom quotes, consciousness, spiritual awakening, Buddhist wisdom, Hindu philosophy"
        canonicalUrl="https://manomaya.lovable.app/quotes"
      />
      <main className="min-h-screen section-teal">
        <Navigation />

        {/* Header */}
        <section className="pt-32 pb-16 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="text-4xl mb-6 block"
            >
              🪷
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-4xl md:text-6xl font-serif text-foreground mb-6"
            >
              Quotes
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-muted-foreground text-lg"
            >
              One thought at a time. One pause at a time.
            </motion.p>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="divider-gold w-24 mx-auto mt-8"
            />
          </div>
        </section>

        {/* Generate New Quote Section */}
        <section className="px-6 pb-12">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-8"
            >
              <Sparkles className="w-8 h-8 mx-auto text-primary mb-4" />
              <h2 className="text-xl font-serif text-foreground mb-4">Generate AI Wisdom</h2>
              <p className="text-muted-foreground mb-6">
                Create a new spiritual quote powered by AI. It will be saved for everyone to see.
              </p>
              <Button
                onClick={handleGenerateNew}
                disabled={isGeneratingQuote}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isGeneratingQuote ? 'animate-spin' : ''}`} />
                {isGeneratingQuote ? 'Generating...' : 'Generate New Quote'}
              </Button>
            </motion.div>
          </div>
        </section>

        {/* AI Generated Quotes */}
        {savedQuotes.length > 0 && (
          <section className="px-6 pb-16">
            <div className="max-w-3xl mx-auto">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center gap-2 mb-8"
              >
                <Sparkles size={16} className="text-primary/60" />
                <p className="text-sm text-primary/60 uppercase tracking-widest">
                  AI Generated Collection
                </p>
                <Sparkles size={16} className="text-primary/60" />
              </motion.div>
              
              <div className="space-y-12">
                <AnimatePresence>
                  {savedQuotes.map((quote, index) => (
                    <motion.article
                      key={quote.id || index}
                      initial={{ opacity: 0, y: 40 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.5, delay: index * 0.05 }}
                      className="text-center"
                    >
                      <blockquote className="font-serif text-2xl md:text-3xl text-primary leading-relaxed italic mb-6">
                        "{quote.text}"
                      </blockquote>
                      <div className="flex items-center justify-center gap-3 mb-3">
                        <div className="divider-gold-solid w-8" />
                        <cite className="text-muted-foreground not-italic text-sm tracking-wide">
                          {quote.author}
                        </cite>
                        <div className="divider-gold-solid w-8" />
                      </div>
                      {quote.created_at && (
                        <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground/50">
                          <Clock size={12} />
                          <span>{formatDate(quote.created_at)}</span>
                        </div>
                      )}
                      {index < savedQuotes.length - 1 && (
                        <div className="mt-12 lotus-decoration" />
                      )}
                    </motion.article>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </section>
        )}

        {/* Loading State */}
        {isLoading && (
          <section className="px-6 pb-16">
            <div className="max-w-3xl mx-auto text-center">
              <RefreshCw className="w-6 h-6 mx-auto text-primary animate-spin" />
              <p className="text-muted-foreground mt-4">Loading quotes...</p>
            </div>
          </section>
        )}

        {/* Static Quotes List */}
        <section className="px-6 pb-24">
          <div className="max-w-3xl mx-auto space-y-12">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center text-sm text-muted-foreground/60 uppercase tracking-widest mb-8"
            >
              Curated Collection
            </motion.p>
            {staticQuotes.map((quote, index) => (
              <motion.article
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.7, delay: index * 0.05 }}
                className="text-center"
              >
                <blockquote className="font-serif text-2xl md:text-3xl text-primary leading-relaxed italic mb-6">
                  "{quote.text}"
                </blockquote>
                <div className="flex items-center justify-center gap-3">
                  <div className="divider-gold-solid w-8" />
                  <cite className="text-muted-foreground not-italic text-sm tracking-wide">
                    {quote.author}
                  </cite>
                  <div className="divider-gold-solid w-8" />
                </div>
                {index < staticQuotes.length - 1 && (
                  <div className="mt-12 lotus-decoration" />
                )}
              </motion.article>
            ))}
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
};

export default Quotes;
