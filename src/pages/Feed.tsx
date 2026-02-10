import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, RefreshCw } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import ReflectionInput from '@/components/ReflectionInput';
import ReflectionCard from '@/components/ReflectionCard';
import PostCard from '@/components/PostCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useReflections, AIReflection } from '@/hooks/useReflections';
import { usePublicPosts } from '@/hooks/usePosts';

type FeedItem = {
  type: 'post' | 'reflection';
  data: any;
  date: Date;
};

export default function Feed() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'notes' | 'reflections'>('all');
  const [localReflections, setLocalReflections] = useState<AIReflection[]>([]);
  
  const { reflections, fetchReflections, isLoading: reflectionsLoading } = useReflections();
  const { data: posts = [], isLoading: postsLoading } = usePublicPosts();

  useEffect(() => {
    fetchReflections();
  }, [fetchReflections]);

  useEffect(() => {
    setLocalReflections(reflections);
  }, [reflections]);

  const handleNewReflection = (reflection: AIReflection) => {
    setLocalReflections(prev => [reflection, ...prev]);
  };

  const feedItems = useMemo(() => {
    const items: FeedItem[] = [];

    if (filter === 'all' || filter === 'notes') {
      posts.forEach(post => {
        items.push({
          type: 'post',
          data: post,
          date: new Date(post.published_at || post.created_at),
        });
      });
    }

    if (filter === 'all' || filter === 'reflections') {
      localReflections.forEach(reflection => {
        items.push({
          type: 'reflection',
          data: reflection,
          date: new Date(reflection.created_at),
        });
      });
    }

    // Sort by date, newest first
    items.sort((a, b) => b.date.getTime() - a.date.getTime());

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return items.filter(item => {
        if (item.type === 'post') {
          return item.data.title.toLowerCase().includes(query) ||
                 item.data.content.toLowerCase().includes(query);
        }
        return item.data.quote.toLowerCase().includes(query) ||
               item.data.explanation.toLowerCase().includes(query) ||
               item.data.user_input?.toLowerCase().includes(query);
      });
    }

    return items;
  }, [posts, localReflections, filter, searchQuery]);

  const isLoading = reflectionsLoading || postsLoading;

  return (
    <>
      <SEOHead
        title="Feed — Spiritual Reflections & Notes | Manomaya"
        description="Explore AI-generated spiritual reflections and mindful notes. A unified feed of wisdom, contemplation, and inner peace."
        keywords="spiritual feed, AI reflections, mindfulness notes, spiritual wisdom, manomaya"
        canonicalUrl="https://manomaya.lovable.app/feed"
      />
      <main className="min-h-screen section-teal">
        <Navigation />

        {/* Header */}
        <section className="pt-32 pb-12 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="text-4xl mb-6 block"
            >
              🌿
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-4xl md:text-6xl font-serif text-foreground mb-6"
            >
              Reflections
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-muted-foreground text-lg"
            >
              Notes and reflections for the seeking soul
            </motion.p>
          </div>
        </section>

        {/* AI Reflection Input */}
        <section className="px-6 pb-12">
          <div className="max-w-2xl mx-auto">
            <ReflectionInput onReflectionGenerated={handleNewReflection} />
          </div>
        </section>

        {/* Search & Filter */}
        <section className="px-6 pb-8">
          <div className="max-w-3xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search reflections..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background/50 border-primary/20"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('all')}
                  className="flex-1 sm:flex-none"
                >
                  All
                </Button>
                <Button
                  variant={filter === 'notes' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('notes')}
                  className="flex-1 sm:flex-none"
                >
                  Notes
                </Button>
                <Button
                  variant={filter === 'reflections' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('reflections')}
                  className="flex-1 sm:flex-none"
                >
                  Reflections
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Feed */}
        <section className="px-6 pb-24">
          <div className="max-w-[750px] mx-auto space-y-10">
            {isLoading ? (
              <div className="text-center py-12">
                <RefreshCw className="w-6 h-6 mx-auto text-primary animate-spin" />
                <p className="text-muted-foreground mt-4">Loading...</p>
              </div>
            ) : feedItems.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {searchQuery ? 'No results found' : 'No content yet. Generate your first reflection!'}
                </p>
              </div>
            ) : (
              <AnimatePresence>
                {feedItems.map((item, index) => (
                  <div key={`${item.type}-${item.data.id}`}>
                    {item.type === 'post' ? (
                      <PostCard post={item.data} index={index} />
                    ) : (
                      <ReflectionCard reflection={item.data} index={index} />
                    )}
                  </div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
}
