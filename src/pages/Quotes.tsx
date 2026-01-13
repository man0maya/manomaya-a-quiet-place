import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Sparkles } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useAIContent, GeneratedQuote } from "@/hooks/useAIContent";
import { Button } from "@/components/ui/button";

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
  const [quotes, setQuotes] = useState<GeneratedQuote[]>(staticQuotes);
  const [featuredQuote, setFeaturedQuote] = useState<GeneratedQuote | null>(null);
  const { generateQuote, isGeneratingQuote } = useAIContent();

  // Generate a featured quote on mount
  useEffect(() => {
    const loadFeaturedQuote = async () => {
      const quote = await generateQuote();
      if (quote) {
        setFeaturedQuote(quote);
      }
    };
    loadFeaturedQuote();
  }, []);

  const handleGenerateNew = async () => {
    const quote = await generateQuote();
    if (quote) {
      setFeaturedQuote(quote);
    }
  };

  return (
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

      {/* AI Generated Featured Quote */}
      <section className="px-6 pb-12">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-8 md:p-12"
          >
            <div className="absolute top-4 right-4 flex items-center gap-2 text-xs text-primary/60">
              <Sparkles size={14} />
              <span>AI Generated</span>
            </div>

            <AnimatePresence mode="wait">
              {isGeneratingQuote ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-8"
                >
                  <RefreshCw className="w-8 h-8 mx-auto text-primary animate-spin mb-4" />
                  <p className="text-muted-foreground">Generating wisdom...</p>
                </motion.div>
              ) : featuredQuote ? (
                <motion.div
                  key={featuredQuote.text}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.5 }}
                  className="text-center"
                >
                  <blockquote className="font-serif text-2xl md:text-3xl text-primary leading-relaxed italic mb-6">
                    "{featuredQuote.text}"
                  </blockquote>
                  <div className="flex items-center justify-center gap-3 mb-8">
                    <div className="divider-gold-solid w-8" />
                    <cite className="text-muted-foreground not-italic text-sm tracking-wide">
                      {featuredQuote.author}
                    </cite>
                    <div className="divider-gold-solid w-8" />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8"
                >
                  <p className="text-muted-foreground">Click below to generate a quote</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="text-center">
              <Button
                onClick={handleGenerateNew}
                disabled={isGeneratingQuote}
                variant="outline"
                className="border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isGeneratingQuote ? 'animate-spin' : ''}`} />
                Generate New Quote
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

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
          {quotes.map((quote, index) => (
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
              {index < quotes.length - 1 && (
                <div className="mt-12 lotus-decoration" />
              )}
            </motion.article>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default Quotes;
