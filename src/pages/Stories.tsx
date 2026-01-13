import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, RefreshCw, Sparkles, BookOpen } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useAIContent, GeneratedStory } from "@/hooks/useAIContent";
import { Button } from "@/components/ui/button";

const staticStories = [
  {
    id: "the-art-of-stillness",
    title: "The Art of Stillness",
    excerpt: "There is a quiet that lives between heartbeats. Not silence — that would be too simple. But a pause, deliberate and knowing, where the mind finally rests.",
    date: "January 2026",
    readTime: "5 min read",
  },
  {
    id: "letters-to-the-morning",
    title: "Letters to the Morning",
    excerpt: "Each dawn arrives without announcement, expecting nothing in return. Perhaps that is why it feels so holy — this light that asks for nothing but presence.",
    date: "December 2025",
    readTime: "4 min read",
  },
  {
    id: "the-weight-of-gentle-things",
    title: "The Weight of Gentle Things",
    excerpt: "A leaf falls. A breath releases. A thought dissolves before it fully forms. These weightless moments carry more than we know.",
    date: "November 2025",
    readTime: "6 min read",
  },
];

const Stories = () => {
  const [generatedStory, setGeneratedStory] = useState<GeneratedStory | null>(null);
  const [showFullStory, setShowFullStory] = useState(false);
  const { generateStory, isGeneratingStory } = useAIContent();

  const handleGenerateStory = async () => {
    setShowFullStory(false);
    const story = await generateStory();
    if (story) {
      setGeneratedStory(story);
    }
  };

  return (
    <main className="min-h-screen">
      <Navigation />

      {/* Header - Teal section */}
      <section className="section-teal pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-4xl mb-6 block"
          >
            📖
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-4xl md:text-6xl font-serif text-foreground mb-6"
          >
            Stories
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-muted-foreground text-lg"
          >
            Longer reflections for deeper reading
          </motion.p>
        </div>
      </section>

      {/* AI Generated Story Section */}
      <section className="section-teal px-6 pb-12">
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
              {isGeneratingStory ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-12"
                >
                  <RefreshCw className="w-8 h-8 mx-auto text-primary animate-spin mb-4" />
                  <p className="text-muted-foreground">Crafting a new reflection...</p>
                </motion.div>
              ) : generatedStory ? (
                <motion.div
                  key={generatedStory.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground/70">
                    <time>{generatedStory.date}</time>
                    <span>•</span>
                    <span>{generatedStory.readTime}</span>
                  </div>
                  
                  <h2 className="text-3xl md:text-4xl font-serif text-primary mb-4">
                    {generatedStory.title}
                  </h2>
                  
                  <p className="text-muted-foreground leading-relaxed mb-6">
                    {generatedStory.excerpt}
                  </p>

                  <AnimatePresence>
                    {showFullStory && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.5 }}
                        className="border-t border-primary/20 pt-6 mt-6"
                      >
                        <div className="prose prose-invert max-w-none">
                          {generatedStory.content.split('\n\n').map((paragraph, i) => (
                            <p key={i} className="text-foreground/90 leading-relaxed mb-4">
                              {paragraph}
                            </p>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex flex-wrap gap-3 mt-6">
                    <Button
                      onClick={() => setShowFullStory(!showFullStory)}
                      variant="outline"
                      className="border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
                    >
                      <BookOpen className="w-4 h-4 mr-2" />
                      {showFullStory ? 'Hide Story' : 'Read Full Story'}
                    </Button>
                    <Button
                      onClick={handleGenerateStory}
                      disabled={isGeneratingStory}
                      variant="ghost"
                      className="text-primary/70 hover:text-primary hover:bg-primary/10"
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${isGeneratingStory ? 'animate-spin' : ''}`} />
                      Generate Another
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8"
                >
                  <BookOpen className="w-12 h-12 mx-auto text-primary/40 mb-4" />
                  <p className="text-muted-foreground mb-6">Generate a unique AI-crafted reflection</p>
                  <Button
                    onClick={handleGenerateStory}
                    disabled={isGeneratingStory}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Story
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      {/* Stories List - Cream section */}
      <section className="section-cream py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-center text-sm text-soft-gray/60 uppercase tracking-widest mb-12">
            Curated Collection
          </p>
          {staticStories.map((story, index) => (
            <motion.article
              key={story.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: index * 0.1 }}
              className="group mb-16 last:mb-0"
            >
              <Link to={`/stories/${story.id}`} className="block">
                <div className="border-t border-teal-deep/20 pt-8">
                  <div className="flex items-center gap-4 mb-4 text-sm text-soft-gray">
                    <time>{story.date}</time>
                    <span>•</span>
                    <span>{story.readTime}</span>
                  </div>
                  
                  <h2 className="text-3xl md:text-4xl font-serif text-teal-deep group-hover:text-primary transition-colors duration-500 mb-4">
                    {story.title}
                  </h2>
                  
                  <p className="text-soft-gray leading-relaxed mb-6 reading-width">
                    {story.excerpt}
                  </p>
                  
                  <span className="inline-flex items-center gap-2 text-sm text-teal-deep/70 group-hover:text-primary transition-colors duration-300">
                    Read story
                    <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            </motion.article>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default Stories;
