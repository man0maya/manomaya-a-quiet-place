import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Calendar, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import ShareButton from '@/components/ShareButton';
import { supabase } from '@/integrations/supabase/client';

interface DailyReflectionEntry {
  id: string;
  quote: string;
  explanation: string;
  date: string;
  created_at: string;
}

interface GeneratedQuoteEntry {
  id: string;
  text: string;
  author: string;
  created_at: string;
}

export default function ReflectionsBook() {
  const [reflections, setReflections] = useState<DailyReflectionEntry[]>([]);
  const [generatedQuotes, setGeneratedQuotes] = useState<GeneratedQuoteEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'daily' | 'generated'>('daily');

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setIsLoading(true);
    try {
      const [dailyRes, quotesRes] = await Promise.all([
        supabase
          .from('daily_reflections')
          .select('*')
          .order('date', { ascending: false }),
        supabase
          .from('generated_quotes')
          .select('*')
          .order('created_at', { ascending: false }),
      ]);

      if (dailyRes.data) setReflections(dailyRes.data);
      if (quotesRes.data) setGeneratedQuotes(quotesRes.data);
    } catch (err) {
      console.error('Error fetching reflections book:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatShortDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <>
      <SEOHead
        title="Reflections Book — Manomaya"
        description="A collection of all daily spiritual reflections and generated quotes. Browse the wisdom archive by date."
        keywords="daily reflections, spiritual quotes, wisdom archive, manomaya reflections"
        canonicalUrl="https://manomaya.lovable.app/reflections-book"
      />
      <main className="min-h-screen">
        <Navigation />

        {/* Header */}
        <section className="section-teal pt-32 pb-16 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="flex items-center justify-center gap-3 mb-6">
                <BookOpen className="w-6 h-6 text-primary/60" />
                <h1 className="font-serif text-4xl md:text-5xl text-foreground">
                  Reflections Book
                </h1>
                <BookOpen className="w-6 h-6 text-primary/60" />
              </div>
              <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
                Every day a new reflection is born. Here lies the complete archive —
                a living journal of wisdom, preserved for all who seek.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Tabs */}
        <section className="section-teal px-6 pb-4">
          <div className="max-w-3xl mx-auto flex justify-center gap-4">
            <button
              onClick={() => setActiveTab('daily')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                activeTab === 'daily'
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              <Calendar className="w-4 h-4 inline mr-2" />
              Daily Reflections ({reflections.length})
            </button>
            <button
              onClick={() => setActiveTab('generated')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                activeTab === 'generated'
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              <Sparkles className="w-4 h-4 inline mr-2" />
              Generated Quotes ({generatedQuotes.length})
            </button>
          </div>
        </section>

        {/* Content */}
        <section className="section-teal py-12 px-6">
          <div className="max-w-3xl mx-auto">
            {isLoading ? (
              <div className="text-center py-20">
                <BookOpen className="w-8 h-8 mx-auto text-primary/40 animate-pulse" />
                <p className="text-muted-foreground mt-4 text-sm">Loading reflections...</p>
              </div>
            ) : activeTab === 'daily' ? (
              reflections.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-muted-foreground text-sm">No daily reflections yet. Check back tomorrow.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence mode="popLayout">
                    {reflections.map((r, i) => (
                      <motion.div
                        key={r.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.5) }}
                        className="border border-primary/10 rounded-xl p-6 bg-card/50 backdrop-blur-sm hover:border-primary/20 transition-all duration-300"
                      >
                        {/* Date badge */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-primary/50" />
                            <span className="text-xs text-muted-foreground tracking-wide uppercase">
                              {formatDate(r.date)}
                            </span>
                          </div>
                          <ShareButton
                            title={`Reflection — ${formatShortDate(r.date)}`}
                            text={`"${r.quote}"\n\n${r.explanation}`}
                            url="https://manomaya.lovable.app/reflections-book"
                          />
                        </div>

                        {/* Quote */}
                        <blockquote className="font-serif text-lg md:text-xl text-foreground italic leading-relaxed mb-3">
                          "{r.quote}"
                        </blockquote>

                        {/* Expandable explanation */}
                        <button
                          onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                          className="flex items-center gap-1 text-xs text-primary/60 hover:text-primary transition-colors"
                        >
                          {expandedId === r.id ? (
                            <>Hide reflection <ChevronUp className="w-3 h-3" /></>
                          ) : (
                            <>Read reflection <ChevronDown className="w-3 h-3" /></>
                          )}
                        </button>

                        <AnimatePresence>
                          {expandedId === r.id && (
                            <motion.p
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="text-muted-foreground text-sm leading-relaxed mt-3 overflow-hidden"
                            >
                              {r.explanation}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )
            ) : (
              generatedQuotes.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-muted-foreground text-sm">No generated quotes yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AnimatePresence mode="popLayout">
                    {generatedQuotes.map((q, i) => (
                      <motion.div
                        key={q.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4, delay: Math.min(i * 0.03, 0.5) }}
                        className="border border-primary/10 rounded-xl p-5 bg-card/50 backdrop-blur-sm hover:border-primary/20 transition-all duration-300"
                      >
                        <blockquote className="font-serif text-base text-foreground italic leading-relaxed mb-3">
                          "{q.text}"
                        </blockquote>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-primary/60">— {q.author}</span>
                          <span className="text-xs text-muted-foreground/50">
                            {formatShortDate(q.created_at)}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )
            )}
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
}
