import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, RefreshCw, Sparkles, BookOpen, Clock } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import LikeButton from "@/components/LikeButton";
import ShareButton from "@/components/ShareButton";
import { useAIContent, GeneratedStory } from "@/hooks/useAIContent";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

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
  const [savedStories, setSavedStories] = useState<GeneratedStory[]>([]);
  const [expandedStory, setExpandedStory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { generateStory, fetchSavedStories, isGeneratingStory } = useAIContent();

  // Fetch saved stories on mount
  useEffect(() => {
    const loadStories = async () => {
      setIsLoading(true);
      const stories = await fetchSavedStories();
      setSavedStories(stories);
      setIsLoading(false);
    };
    loadStories();
  }, [fetchSavedStories]);

  const handleGenerateStory = async () => {
    const story = await generateStory();
    if (story) {
      setSavedStories(prev => [story, ...prev]);
      setExpandedStory(story.id || null);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    return format(new Date(dateString), "MMMM d, yyyy 'at' h:mm a");
  };

  const formatShortDate = (dateString?: string) => {
    if (!dateString) return "";
    return format(new Date(dateString), "MMMM yyyy");
  };

  return (
    <>
      <SEOHead 
        title="Spiritual Stories & Contemplative Reflections"
        description="Read contemplative stories and spiritual reflections on mindfulness, inner peace, and awakening. Poetic writings for deeper self-discovery and meditation practice."
        keywords="spiritual stories, contemplative writing, mindfulness reflections, meditation stories, spiritual awakening, inner peace, self-discovery, poetic reflections, zen stories, wisdom tales"
        canonicalUrl="https://manomaya.lovable.app/stories"
      />
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

        {/* Generate Story Section */}
        <section className="section-teal px-6 pb-12">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-8"
            >
              <Sparkles className="w-8 h-8 mx-auto text-primary mb-4" />
              <h2 className="text-xl font-serif text-foreground mb-4">Generate AI Reflection</h2>
              <p className="text-muted-foreground mb-6">
                Create a new contemplative story powered by AI. It will be saved for everyone to read.
              </p>
              <Button
                onClick={handleGenerateStory}
                disabled={isGeneratingStory}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isGeneratingStory ? 'animate-spin' : ''}`} />
                {isGeneratingStory ? 'Creating...' : 'Generate New Story'}
              </Button>
            </motion.div>
          </div>
        </section>

        {/* AI Generated Stories */}
        {savedStories.length > 0 && (
          <section className="section-teal px-6 pb-16">
            <div className="max-w-3xl mx-auto">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center gap-2 mb-8"
              >
                <Sparkles size={16} className="text-primary/60" />
                <p className="text-sm text-primary/60 uppercase tracking-widest">
                  AI Generated Stories
                </p>
                <Sparkles size={16} className="text-primary/60" />
              </motion.div>

              <div className="space-y-8">
                <AnimatePresence>
                  {savedStories.map((story, index) => (
                    <motion.article
                      key={story.id || index}
                      initial={{ opacity: 0, y: 40 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="bg-gradient-to-br from-card/50 to-card/30 border border-primary/10 rounded-lg p-6 md:p-8"
                    >
                      <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground/70">
                        <time>{formatShortDate(story.created_at)}</time>
                        <span>•</span>
                        <span>{story.read_time || story.readTime}</span>
                        {story.created_at && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock size={12} />
                              {format(new Date(story.created_at), "h:mm a")}
                            </span>
                          </>
                        )}
                      </div>
                      
                      <h2 className="text-2xl md:text-3xl font-serif text-primary mb-4">
                        {story.title}
                      </h2>
                      
                      <p className="text-muted-foreground leading-relaxed mb-6">
                        {story.excerpt}
                      </p>

                      <AnimatePresence>
                        {expandedStory === story.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.5 }}
                            className="border-t border-primary/20 pt-6 mt-4"
                          >
                            {story.content.split('\n\n').map((paragraph, i) => (
                              <p key={i} className="text-foreground/90 leading-relaxed mb-4">
                                {paragraph}
                              </p>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="flex items-center gap-4 flex-wrap">
                        <Button
                          onClick={() => setExpandedStory(expandedStory === story.id ? null : story.id || null)}
                          variant="outline"
                          className="border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
                        >
                          <BookOpen className="w-4 h-4 mr-2" />
                          {expandedStory === story.id ? 'Hide Story' : 'Read Full Story'}
                        </Button>
                        {story.id && (
                          <>
                            <LikeButton itemId={story.id} itemType="story" />
                            <ShareButton
                              title={story.title}
                              text={story.excerpt}
                              url={`https://manomaya.lovable.app/stories/${story.id}`}
                            />
                            <Link
                              to={`/stories/${story.id}`}
                              className="text-sm text-muted-foreground hover:text-primary transition-colors"
                            >
                              Open Full Page →
                            </Link>
                          </>
                        )}
                      </div>
                    </motion.article>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </section>
        )}

        {/* Loading State */}
        {isLoading && (
          <section className="section-teal px-6 pb-16">
            <div className="max-w-3xl mx-auto text-center">
              <RefreshCw className="w-6 h-6 mx-auto text-primary animate-spin" />
              <p className="text-muted-foreground mt-4">Loading stories...</p>
            </div>
          </section>
        )}

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
    </>
  );
};

export default Stories;
